import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 24, message }) => {
  return (
    <div className="loading-spinner">
      <div
        className="spinner"
        style={{ width: size, height: size }}
      />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
