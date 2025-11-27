import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import './ThemeAnimations.css';

const ThemeAnimations: React.FC = () => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!theme || !theme.theme.animations || theme.theme.animations.length === 0) {
      return;
    }

    const animations = theme.theme.animations;
    const container = containerRef.current;
    if (!container) return;

    // Cleanup previous animations
    animationRefs.current.forEach(cleanup => cleanup());
    animationRefs.current = [];
    container.innerHTML = '';

    // Initialize animations based on type
    animations.forEach((animationType) => {
      let cleanup: (() => void) | null = null;
      
      switch (animationType) {
        case 'snow':
          cleanup = initSnowAnimation(container);
          break;
        case 'hearts':
          cleanup = initHeartsAnimation(container);
          break;
        case 'stars':
          cleanup = initStarsAnimation(container);
          break;
        case 'sparkles':
          cleanup = initSparklesAnimation(container);
          break;
        case 'confetti':
          cleanup = initConfettiAnimation(container);
          break;
        case 'string-lights':
          cleanup = initStringLightsAnimation(container);
          break;
      }
      
      if (cleanup) {
        animationRefs.current.push(cleanup);
      }
    });

    return () => {
      // Cleanup on unmount
      animationRefs.current.forEach(cleanup => cleanup());
      animationRefs.current = [];
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [theme]);

  return <div ref={containerRef} className="theme-animations" />;
};

// Animation initialization functions
function initSnowAnimation(container: HTMLElement): () => void {
  const snowflakes: HTMLElement[] = [];
  let animationId: number | null = null;

  const createSnowflake = () => {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.style.left = `${Math.random() * 100}%`;
    snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
    snowflake.style.opacity = `${Math.random() * 0.5 + 0.5}`;
    container.appendChild(snowflake);
    snowflakes.push(snowflake);

    // Remove after animation
    setTimeout(() => {
      if (snowflake.parentNode) {
        snowflake.parentNode.removeChild(snowflake);
      }
      const index = snowflakes.indexOf(snowflake);
      if (index > -1) {
        snowflakes.splice(index, 1);
      }
    }, 5000);
  };

  // Create snowflakes periodically
  const interval = setInterval(createSnowflake, 300);
  createSnowflake(); // Create initial snowflake

  return () => {
    clearInterval(interval);
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
    snowflakes.forEach(snowflake => {
      if (snowflake.parentNode) {
        snowflake.parentNode.removeChild(snowflake);
      }
    });
  };
}

function initHeartsAnimation(container: HTMLElement): () => void {
  const hearts: HTMLElement[] = [];
  let intervalId: NodeJS.Timeout | null = null;

  const createHeart = () => {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDuration = `${Math.random() * 2 + 2}s`;
    container.appendChild(heart);
    hearts.push(heart);

    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart);
      }
      const index = hearts.indexOf(heart);
      if (index > -1) {
        hearts.splice(index, 1);
      }
    }, 4000);
  };

  intervalId = setInterval(createHeart, 800);
  createHeart();

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    hearts.forEach(heart => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart);
      }
    });
  };
}

function initStarsAnimation(container: HTMLElement): () => void {
  container.classList.add('stars-container');
  const stars: HTMLElement[] = [];

  for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 2}s`;
    star.style.animationDuration = `${Math.random() * 2 + 1}s`;
    container.appendChild(star);
    stars.push(star);
  }

  return () => {
    stars.forEach(star => {
      if (star.parentNode) {
        star.parentNode.removeChild(star);
      }
    });
    container.classList.remove('stars-container');
  };
}

function initSparklesAnimation(container: HTMLElement): () => void {
  const sparkles: HTMLElement[] = [];
  let intervalId: NodeJS.Timeout | null = null;

  const createSparkle = () => {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDuration = `${Math.random() * 1 + 0.5}s`;
    container.appendChild(sparkle);
    sparkles.push(sparkle);

    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
      const index = sparkles.indexOf(sparkle);
      if (index > -1) {
        sparkles.splice(index, 1);
      }
    }, 1500);
  };

  intervalId = setInterval(createSparkle, 200);
  createSparkle();

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    sparkles.forEach(sparkle => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    });
  };
}

function initConfettiAnimation(container: HTMLElement): () => void {
  const confetti: HTMLElement[] = [];
  const colors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF'];
  let intervalId: NodeJS.Timeout | null = null;

  const createConfetti = () => {
    for (let i = 0; i < 10; i++) {
      const confettiPiece = document.createElement('div');
      confettiPiece.className = 'confetti';
      confettiPiece.style.left = `${Math.random() * 100}%`;
      confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confettiPiece.style.animationDuration = `${Math.random() * 2 + 2}s`;
      container.appendChild(confettiPiece);
      confetti.push(confettiPiece);

      setTimeout(() => {
        if (confettiPiece.parentNode) {
          confettiPiece.parentNode.removeChild(confettiPiece);
        }
        const index = confetti.indexOf(confettiPiece);
        if (index > -1) {
          confetti.splice(index, 1);
        }
      }, 4000);
    }
  };

  intervalId = setInterval(createConfetti, 1000);
  createConfetti();

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    confetti.forEach(piece => {
      if (piece.parentNode) {
        piece.parentNode.removeChild(piece);
      }
    });
  };
}

function initStringLightsAnimation(container: HTMLElement): () => void {
  container.classList.add('string-lights-container');
  const lights: HTMLElement[] = [];

  for (let i = 0; i < 20; i++) {
    const light = document.createElement('div');
    light.className = 'string-light';
    light.style.left = `${(i * 100) / 20}%`;
    light.style.animationDelay = `${i * 0.1}s`;
    container.appendChild(light);
    lights.push(light);
  }

  return () => {
    lights.forEach(light => {
      if (light.parentNode) {
        light.parentNode.removeChild(light);
      }
    });
    container.classList.remove('string-lights-container');
  };
}

export default ThemeAnimations;

