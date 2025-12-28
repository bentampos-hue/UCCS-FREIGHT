
import React from 'react';

interface Segment {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeId: string;
  onChange: (id: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ segments, activeId, onChange }) => {
  return (
    <div className="bg-slate-100 p-1 rounded-xl flex items-center relative h-10 w-full max-w-md">
      {segments.map((segment) => (
        <button
          key={segment.id}
          onClick={() => onChange(segment.id)}
          className={`relative z-10 flex-1 px-4 py-1.5 text-xs font-bold transition-all duration-200 rounded-lg ${
            activeId === segment.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {segment.label}
        </button>
      ))}
      <div 
        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out"
        style={{
          width: `calc(${100 / segments.length}% - 4px)`,
          left: `calc(${(segments.findIndex(s => s.id === activeId) * (100 / segments.length))}% + 2px)`
        }}
      />
    </div>
  );
};
