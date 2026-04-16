import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Progress Text */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[var(--edu-text-primary)]">
          Step {currentStep + 1} of {steps.length}
        </h3>
        <span className="text-sm text-[var(--edu-text-secondary)]">{Math.round(progress)}% complete</span>
      </div>

      {/* Stepper */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--edu-divider)]">
          <div
            className="h-full bg-[var(--edu-blue)] transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={index} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 transition-all duration-200
                    ${isCompleted ? 'bg-[var(--edu-blue)] text-white' : ''}
                    ${isCurrent ? 'bg-[var(--edu-blue)] text-white pulse-ring' : ''}
                    ${isUpcoming ? 'bg-white border-2 border-[var(--edu-border)] text-[var(--edu-text-tertiary)]' : ''}
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </div>

                {/* Label */}
                <span
                  className={`text-xs text-center transition-colors ${
                    isCurrent
                      ? 'text-[var(--edu-text-primary)] font-semibold'
                      : 'text-[var(--edu-text-secondary)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
