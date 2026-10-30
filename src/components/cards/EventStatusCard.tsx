import React from 'react';

interface EventStatusCardProps {
  isFinished: boolean;
  firstActivityTime?: string;
}

export const EventStatusCard: React.FC<EventStatusCardProps> = ({
  isFinished,
  firstActivityTime = '07:00 a. m.'
}) => {
  return (
    <div
      className={`w-full rounded-[18px] p-[18px] text-center border transition-colors shadow-xs ${
        isFinished
          ? 'bg-[#F1F5F9] dark:bg-[#172338] border-[#CBD5E1] dark:border-[#293A52]'
          : 'bg-[#EFF6FF] dark:bg-[#14233B] border-[#BFDBFE] dark:border-[#1E3A5F]'
      }`}
    >
      <h3
        className={`text-[16px] font-bold ${
          isFinished ? 'text-[#1E293B] dark:text-[#F1F5F9]' : 'text-[#0F172A] dark:text-[#F1F5F9]'
        }`}
      >
        {isFinished
          ? 'El FSY ha finalizado'
          : `El FSY inicia a las ${firstActivityTime}`}
      </h3>
      <p className="text-[13px] text-[#64748B] dark:text-[#A8B8CC] mt-1.5 leading-[18px]">
        {isFinished
          ? '¡Muchas gracias por tu tiempo, esfuerzo y amor dedicado a los jóvenes del Distrito Granada!'
          : 'Prepárate para recibir a los jóvenes de tu compañía. Revisa las instrucciones de acreditación y bienvenida.'}
      </p>
    </div>
  );
};
