"use client";

import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  score: number; // 0-1
  size?: number;
}

export default function ConfidenceMeter({ score, size = 120 }: ConfidenceMeterProps) {
  const percentage = Math.round(score * 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  const getColor = () => {
    if (percentage >= 80) return "var(--accent-success)";
    if (percentage >= 60) return "var(--accent-primary)";
    if (percentage >= 40) return "var(--accent-warning)";
    return "var(--accent-danger)";
  };

  const getLabel = () => {
    if (percentage >= 80) return "High";
    if (percentage >= 60) return "Moderate";
    if (percentage >= 40) return "Low";
    return "Very Low";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-2xl font-display font-bold"
            style={{ color: getColor() }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>
      <span className="text-sm text-text-secondary mt-2 font-medium">{getLabel()} Confidence</span>
    </div>
  );
}
