import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-slate-100 flex justify-center selection:bg-sky-100">
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col shadow-2xl relative overflow-x-clip">
        {children}
      </div>
    </div>
  );
};

