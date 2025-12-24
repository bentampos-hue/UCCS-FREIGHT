
import React, { useState } from 'react';
import { Mail, Settings, FileText, Send, CheckCircle, ArrowRight, Server, PlayCircle } from 'lucide-react';
import { SharedProps } from '../types';

const steps = [
  {
    id: 'A',
    title: 'Intake & Vendor Match',
    icon: Server,
    description: 'System filters Vendor Database for matching trade lanes and automatically sends rate requests to top 3 matches.',
    tech: 'Vendor API / Email Parser',
    time: 'T+0 mins'
  },
  {
    id: 'B',
    title: 'Quote Generation',
    icon: Settings,
    description: 'Once rates are received, system applies pre-set margin and generates a branded PDF Offer.',
    tech: 'Pricing Engine',
    time: 'T+5 mins'
  },
  {
    id: 'C',
    title: 'Smart Dispatch',
    icon: Send,
    description: 'HTML summary + PDF Attachment sent to customer. Includes "One-Click Confirm" button.',
    tech: 'SMTP / SendGrid',
    time: 'T+6 mins'
  },
  {
    id: 'D',
    title: 'Auto-Follow Up',
    icon: ClockIcon,
    description: 'If status remains "Quoted" for 48h, triggers polite follow-up email.',
    tech: 'Cron Job Scheduler',
    time: 'T+48 hours'
  },
  {
    id: 'E',
    title: 'Fulfillment',
    icon: CheckCircle,
    description: 'Customer clicks confirm. Winning Vendor alerted. Operations notified.',
    tech: 'Booking API',
    time: 'Instant'
  }
];

// Helper icon component since we can't import ClockIcon easily if it wasn't in the top import
function ClockIcon(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const WorkflowVisualizer: React.FC<SharedProps> = () => {
  const [activeStep, setActiveStep] = useState<string | null>(steps[0].id);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg shadow-sm">
        <h3 className="font-bold text-indigo-900 mb-1">Automation Workflow Logic</h3>
        <p className="text-indigo-800 text-sm">
          Explore the Critical Path from enquiry intake to final booking. Click on any step in the visualizer below to understand the logic, timing, and technology behind each stage of the UCCS automation.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        {/* Visualizer - Desktop (Horizontal) */}
        <div className="hidden lg:flex justify-between items-start relative mb-12">
          {/* Connecting Line */}
          <div className="absolute top-8 left-0 w-full h-1 bg-slate-100 -z-10"></div>
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`relative flex flex-col items-center group focus:outline-none transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 z-10 transition-colors duration-300 ${
                  isActive 
                    ? 'bg-blue-600 border-blue-100 text-white shadow-lg' 
                    : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500'
                }`}>
                  <Icon size={24} />
                </div>
                <div className="mt-4 text-center">
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>Step {step.id}</span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visualizer - Mobile (Vertical) */}
        <div className="lg:hidden space-y-4 mb-8">
          {steps.map((step) => {
             const Icon = step.icon;
             const isActive = activeStep === step.id;
             return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-full flex items-center p-3 rounded-lg border ${
                  isActive ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-full mr-3 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={16} />
                </div>
                <span className={`font-medium ${isActive ? 'text-blue-800' : 'text-slate-600'}`}>{step.title}</span>
              </button>
             )
          })}
        </div>

        {/* Details Panel */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 min-h-[200px] transition-all duration-500">
          {activeStep ? (
            (() => {
              const step = steps.find(s => s.id === activeStep)!;
              const Icon = step.icon;
              return (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Icon size={24} />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">{step.title}</h4>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-500">
                        Logic: {step.tech}
                      </span>
                      <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-semibold text-emerald-600">
                        Timing: {step.time}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-center items-center text-center">
                    <div className="text-4xl text-slate-200 mb-2">
                      <PlayCircle size={48} strokeWidth={1} />
                    </div>
                    <p className="text-xs text-slate-400">
                      Automation Logic Visualization<br/>
                      (Back-end Process)
                    </p>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select a step to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowVisualizer;
