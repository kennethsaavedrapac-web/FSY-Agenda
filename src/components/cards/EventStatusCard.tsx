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
      className={`w-full rounded-[18px] p-[18px] text-center border ${
        isFinished
          ? 'bg-[#F1F5F9] border-[#CBD5E1]'
          : 'bg-[#EFF6FF] border-[#BFDBFE]'
      }`}
    >
      <h3
        className={`text-[16px] font-bold ${
          isFinished ? 'text-[#1E293B]' : 'text-[#0F172A]'
        }`}
      >
        {isFinished
          ? 'El FSY ha finalizado'
          : `El FSY inicia a las ${firstActivityTime}`}
      </h3>
      <p className="text-[13px] text-[#64748B] mt-1.5 leading-[18px]">
        {isFinished
          ? '¡Muchas gracias por tu tiempo, esfuerzo y amor dedicado a los jóvenes del Distrito Granada!'
          : 'Prepárate para recibir a los jóvenes de tu compañía. Revisa las instrucciones de acreditación y bienvenida.'}
      </p>
    </div>
  );
};

