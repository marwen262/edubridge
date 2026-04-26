$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImageCropper {
    public static void CropTransparent(string path) {
        Bitmap bmp = new Bitmap(path);
        int width = bmp.Width;
        int height = bmp.Height;

        int minX = width;
        int maxX = 0;
        int minY = height;
        int maxY = 0;

        BitmapData data = bmp.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        int bytes = Math.Abs(data.Stride) * height;
        byte[] argbValues = new byte[bytes];
        Marshal.Copy(data.Scan0, argbValues, 0, bytes);
        bmp.UnlockBits(data);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int index = (y * data.Stride) + (x * 4);
                byte a = argbValues[index + 3];
                if (a > 10) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (minX <= maxX && minY <= maxY) {
            Rectangle rect = new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
            Bitmap cropped = bmp.Clone(rect, bmp.PixelFormat);
            bmp.Dispose();
            cropped.Save(path, ImageFormat.Png);
            Console.WriteLine("Cropped to " + rect.Width + "x" + rect.Height);
            cropped.Dispose();
        } else {
            bmp.Dispose();
            Console.WriteLine("Empty image");
        }
    }
}
"@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[ImageCropper]::CropTransparent("c:\Users\marwe\OneDrive\Documents\GitHub\edubridge\frontend\src\assets\logo\logoedubridge.png")
