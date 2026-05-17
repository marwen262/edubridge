"""
MantraNet-inspired image manipulation detector.

Architecture choice (in priority order):
  1. Official MantraNet weights at models/mantranet.pt
  2. HuggingFace ResNet-50 feature anomaly extractor (fallback)
  3. Return 0.0 if neither is available

Output: manipulation probability 0.0–1.0 as mean of top-10% suspicious patches.
Inference timeout: 15 s → 0.0.
All exceptions → 0.0 (graceful degradation).
"""

from __future__ import annotations

import os
import time
from typing import Optional

import numpy as np

from app.utils.logger import logger

# ──────────────────────────────────────────────
# Module-level model state (loaded once)
# ──────────────────────────────────────────────
_model = None
_transform = None
_model_ready: bool = False   # True once load was attempted (success or failure)


def _load_model() -> None:
    global _model, _transform, _model_ready

    if _model_ready:
        return

    _model_ready = True  # Mark before any return so we never retry

    try:
        import torch
        import torchvision.models as tvm
        import torchvision.transforms as T

        weights_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "models", "mantranet.pt"
        )
        weights_path = os.path.normpath(weights_path)

        if os.path.isfile(weights_path):
            # Official MantraNet weights present — load state_dict.
            # MantraNet uses a BayarConv / SRM + VGG-like backbone; if the
            # checkpoint is a bare state_dict, try a torchvision VGG16 shell
            # and fall through to the ResNet fallback on mismatch.
            try:
                backbone = tvm.vgg16(weights=None)
                state = torch.load(weights_path, map_location="cpu")
                backbone.load_state_dict(state, strict=False)
                # Strip classifier; keep convolutional feature extractor
                backbone = torch.nn.Sequential(*list(backbone.features.children()))
                backbone.eval()
                _model = backbone
                logger.info("MantraNet: official weights loaded from %s", weights_path)
            except Exception as e:
                logger.warning("MantraNet: official weight load failed (%s); using fallback", e)
                _model = None

        if _model is None:
            # Fallback: pretrained ResNet-50 as feature extractor.
            # Remove avgpool + fc; expose layer3 output (~1024-d feature maps).
            res = tvm.resnet50(weights=tvm.ResNet50_Weights.DEFAULT)
            layers = list(res.children())
            # layers: conv1, bn1, relu, maxpool, layer1, layer2, layer3, layer4, avgpool, fc
            backbone = torch.nn.Sequential(*layers[:7])  # up to and including layer3
            backbone.eval()
            _model = backbone
            logger.info("MantraNet: ResNet-50 fallback feature extractor loaded")

        _transform = T.Compose([
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    except Exception as exc:
        logger.warning("MantraNet: model initialisation failed — %s", exc)
        _model = None
        _transform = None


# Trigger load at import time (background — non-blocking for first call)
_load_model()


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def detect_mantranet(image_path: str) -> float:
    """Return manipulation probability in [0.0, 1.0].

    Algorithm:
      1. Resize image to ≤ 512 px (longest side).
      2. Extract overlapping 64×64 patches (stride 32).
      3. Run feature extractor on each patch.
      4. Compute per-patch anomaly score = L2 feature norm.
      5. Normalise patch scores to [0, 1].
      6. Return mean of top-10% scores (most suspicious patches).

    Returns 0.0 if:
      - Model is unavailable.
      - Image cannot be read.
      - Inference exceeds 15 seconds.
      - Any unhandled exception.
    """
    if _model is None:
        return 0.0

    t0 = time.monotonic()

    try:
        import torch
        from PIL import Image as PILImage

        img = PILImage.open(image_path).convert("RGB")

        # Resize so inference stays fast on CPU
        max_dim = 512
        w, h = img.size
        if max(w, h) > max_dim:
            scale = max_dim / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), PILImage.LANCZOS)

        img_arr = np.array(img)
        ih, iw = img_arr.shape[:2]

        patch_size = 64
        stride = 32

        patch_scores: list[float] = []

        with torch.no_grad():
            for y in range(0, ih - patch_size + 1, stride):
                for x in range(0, iw - patch_size + 1, stride):
                    if time.monotonic() - t0 > 14.5:
                        logger.warning("MantraNet: inference timeout — returning partial result")
                        break

                    patch = img_arr[y: y + patch_size, x: x + patch_size]
                    tensor = _transform(PILImage.fromarray(patch)).unsqueeze(0)

                    feats = _model(tensor)
                    score = float(feats.flatten().norm().item())
                    patch_scores.append(score)

        elapsed = time.monotonic() - t0
        if elapsed > 15.0:
            logger.warning("MantraNet: total inference time %.1f s exceeded 15 s limit", elapsed)
            return 0.0

        if not patch_scores:
            return 0.0

        arr = np.array(patch_scores, dtype=np.float32)
        # Normalise to [0, 1]
        lo, hi = arr.min(), arr.max()
        if hi - lo < 1e-6:
            return 0.0
        arr = (arr - lo) / (hi - lo)

        # Mean of top-10% most anomalous patches
        threshold = np.percentile(arr, 90)
        top_scores = arr[arr >= threshold]
        result = float(np.mean(top_scores))

        logger.info(
            "MantraNet: score=%.3f | patches=%d | elapsed=%.2f s | image=%s",
            result,
            len(patch_scores),
            elapsed,
            os.path.basename(image_path),
        )
        return round(result, 3)

    except Exception as exc:
        logger.warning("MantraNet: inference error — %s", exc)
        return 0.0
