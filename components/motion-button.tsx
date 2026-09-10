'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  tone?: 'quiet' | 'soft' | 'primary' | 'lime';
  children: React.ReactNode;
};

export function MotionButton({
  className,
  tone = 'quiet',
  children,
  ...props
}: MotionButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      className={cn('motion-button', `motion-button-${tone}`, className)}
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.015 }}
      whileTap={reduceMotion ? undefined : { y: 0, scale: 0.965 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30, mass: 0.55 }}
      {...props}
    >
      <span className="button-shine" aria-hidden="true" />
      <span className="button-content">{children}</span>
    </motion.button>
  );
}
