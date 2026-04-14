import { createContext, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './Toast.module.css';

export const ToastContext = createContext({ showToast: () => {} });

const ICONS = { 
  success: '✓', 
  error: '✕', 
  warning: '⚠', 
  info: 'ℹ' 
};

const DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000
};

// 아이콘 애니메이션 variants
const iconVariants = {
  success: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    }
  },
  error: {
    initial: { scale: 0 },
    animate: { 
      scale: 1,
      rotate: [0, -10, 10, -10, 10, 0],
      transition: {
        scale: { type: 'spring', stiffness: 300, damping: 10 },
        rotate: { duration: 0.5, ease: 'easeInOut' }
      }
    }
  },
  warning: {
    initial: { scale: 0, y: -10 },
    animate: { 
      scale: 1,
      y: [0, -5, 0],
      transition: {
        scale: { type: 'spring', stiffness: 300, damping: 15 },
        y: { 
          repeat: Infinity,
          duration: 1.5,
          ease: 'easeInOut'
        }
      }
    }
  },
  info: {
    initial: { scale: 0, y: 20 },
    animate: { 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
        bounce: 0.6
      }
    }
  }
};

// Toast 애니메이션 variants
const toastVariants = {
  initial: { 
    opacity: 0, 
    x: 100,
    scale: 0.8
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    x: 100,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

function ToastItem({ id, type, message, onRemove }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(DURATIONS[type]);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onRemove(id);
    }, remainingTimeRef.current);

    // Progress 애니메이션
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const newProgress = (remaining / DURATIONS[type]) * 100;
      setProgress(newProgress);
      
      if (remaining <= 0) {
        clearInterval(progressInterval);
      }
    }, 16); // ~60fps

    return () => clearInterval(progressInterval);
  }, [id, type, onRemove]);

  useEffect(() => {
    const cleanup = startTimer();
    return () => {
      cleanup?.();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimer();
  };

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onRemove(id);
  };

  return (
    <motion.div 
      className={`${styles.toast} ${styles[type]}`}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      style={{ cursor: isPaused ? 'pointer' : 'default' }}>
      
      {/* 아이콘 */}
      <motion.span 
        className={styles.icon}
        variants={iconVariants[type]}
        initial="initial"
        animate="animate">
        {ICONS[type]}
      </motion.span>
      
      {/* 메시지 */}
      <span className={styles.message}>{message}</span>
      
      {/* 닫기 버튼 */}
      <motion.button 
        className={styles.close} 
        type="button" 
        onClick={dismiss}
        whileHover={{ scale: 1.2, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}>
        ✕
      </motion.button>
      
      {/* Progress bar */}
      <motion.div 
        className={styles.progress}
        initial={{ scaleX: 1 }}
        animate={{ 
          scaleX: progress / 100,
          transition: { duration: 0.016, ease: 'linear' }
        }}
        style={{ 
          transformOrigin: 'left',
          opacity: isPaused ? 0.3 : 1
        }}
      />
    </motion.div>
  );
}

export function ToastContainer({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        <AnimatePresence mode="popLayout">
          {toasts.map((t, index) => (
            <ToastItem 
              key={t.id} 
              {...t} 
              onRemove={removeToast}
              style={{ '--stagger-delay': `${index * 0.1}s` }}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
