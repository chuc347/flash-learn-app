import React from 'react';
import { motion } from 'framer-motion';
import { FlashcardProps } from '../types';

export default function Flashcard({ word, translation, isFlipped, showFront }: FlashcardProps) {
  return (
    <div className="relative w-full h-80 perspective">
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-white/70 mb-4">
                {showFront ? 'English' : 'Vietnamese'}
              </p>
              <p className="text-4xl text-white break-words">
                {word}
              </p>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl shadow-2xl flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-white/70 mb-4">Answer</p>
              <p className="text-4xl text-white break-words">
                {translation}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}