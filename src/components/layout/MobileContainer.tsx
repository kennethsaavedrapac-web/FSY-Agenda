import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-slate-100 dark:bg-[#060A12] flex justify-center selection:bg-sky-100 dark:selection:bg-sky-900 transition-colors">
      <div className="w-full max-w-md min-h-screen bg-white dark:bg-[#0B1220] flex flex-col shadow-2xl relative overflow-x-clip transition-colors">
        {children}
      </div>
    </div>
  );
};
