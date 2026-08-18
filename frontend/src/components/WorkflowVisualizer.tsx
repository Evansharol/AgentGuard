import React, { useState } from 'react';
import {
  UserCheck,
  FileSpreadsheet,
  Play,
  BrainCircuit,
  ShieldAlert,
  ClipboardCheck,
  Gauge,
  GitFork,
  UserCog,
  Activity,
  Award,
  Archive
} from 'lucide-react';

interface StepNode {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgGlow: string;
  borderColor: string;
  iconColor: string;
  position: 'top' | 'bottom';
}

const STEPS: StepNode[] = [
  {
    id: 1,
    title: 'Select AI Agent',
    subtitle: 'Choose the specific AI agent for the task.',
    icon: UserCheck,
    color: 'from-blue-500 to-indigo-600',
    bgGlow: 'rgba(59, 130, 246, 0.25)',
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-200',
    position: 'top'
  },
  {
    id: 2,
    title: 'Give Task and Data',
    subtitle: 'Provide the task instructions and upload necessary data.',
    icon: FileSpreadsheet,
    color: 'from-blue-600 to-cyan-600',
    bgGlow: 'rgba(37, 99, 235, 0.25)',
    borderColor: 'border-blue-400',
    iconColor: 'text-blue-200',
    position: 'bottom'
  },
  {
    id: 3,
    title: 'Run Test',
    subtitle: 'Initiate the testing process for the AI agent.',
    icon: Play,
    color: 'from-cyan-500 to-teal-500',
    bgGlow: 'rgba(6, 182, 212, 0.25)',
    borderColor: 'border-cyan-400',
    iconColor: 'text-cyan-100',
    position: 'top'
  },
  {
    id: 4,
    title: 'AI Agent Executes',
    subtitle: 'The AI agent begins performing the assigned task.',
    icon: BrainCircuit,
    color: 'from-cyan-600 to-sky-600',
    bgGlow: 'rgba(8, 145, 178, 0.25)',
    borderColor: 'border-cyan-400',
    iconColor: 'text-cyan-200',
    position: 'bottom'
  },
  {
    id: 5,
    title: 'AgentGuard Intercepts',
    subtitle: 'AgentGuard monitors and intercepts the agent’s actions.',
    icon: ShieldAlert,
    color: 'from-purple-500 to-violet-600',
    bgGlow: 'rgba(168, 85, 247, 0.3)',
    borderColor: 'border-purple-400',
    iconColor: 'text-purple-100',
    position: 'top'
  },
  {
    id: 6,
    title: 'Check Policy',
    subtitle: 'Evaluate the action against established safety policies.',
    icon: ClipboardCheck,
    color: 'from-purple-600 to-fuchsia-600',
    bgGlow: 'rgba(147, 51, 234, 0.3)',
    borderColor: 'border-purple-400',
    iconColor: 'text-purple-200',
    position: 'bottom'
  },
  {
    id: 7,
    title: 'Monitor Risk',
    subtitle: 'Execute a risk check based on policy results.',
    icon: Gauge,
    color: 'from-pink-500 to-rose-500',
    bgGlow: 'rgba(236, 72, 153, 0.3)',
    borderColor: 'border-pink-400',
    iconColor: 'text-pink-100',
    position: 'top'
  },
  {
    id: 8,
    title: 'Approval or Block',
    subtitle: 'Determine if the action is approved or blocked.',
    icon: GitFork,
    color: 'from-orange-500 to-amber-600',
    bgGlow: 'rgba(249, 115, 22, 0.3)',
    borderColor: 'border-orange-400',
    iconColor: 'text-orange-100',
    position: 'bottom'
  },
  {
    id: 9,
    title: 'Human Review',
    subtitle: 'Human review is conducted to stop the action if necessary.',
    icon: UserCog,
    color: 'from-amber-500 to-orange-500',
    bgGlow: 'rgba(245, 158, 11, 0.3)',
    borderColor: 'border-amber-400',
    iconColor: 'text-amber-100',
    position: 'top'
  },
  {
    id: 10,
    title: 'Performance & Safety',
    subtitle: 'Assess the performance and safety of the execution.',
    icon: Activity,
    color: 'from-lime-500 to-emerald-600',
    bgGlow: 'rgba(132, 204, 22, 0.3)',
    borderColor: 'border-lime-400',
    iconColor: 'text-lime-100',
    position: 'bottom'
  },
  {
    id: 11,
    title: 'Test Result',
    subtitle: 'Generate the final outcome of the test.',
    icon: Award,
    color: 'from-lime-400 to-green-500',
    bgGlow: 'rgba(163, 230, 53, 0.3)',
    borderColor: 'border-lime-300',
    iconColor: 'text-lime-950',
    position: 'top'
  },
  {
    id: 12,
    title: 'Audit & History',
    subtitle: 'Record the audit trail and history of the process.',
    icon: Archive,
    color: 'from-emerald-500 to-green-600',
    bgGlow: 'rgba(16, 185, 129, 0.3)',
    borderColor: 'border-emerald-400',
    iconColor: 'text-emerald-100',
    position: 'bottom'
  }
];

export const WorkflowVisualizer: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="w-full bg-slate-950 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
          AI Agent Execution and Safety Workflow
        </h2>
        <p className="text-xs text-slate-400">
          The complete end-to-end path from task declaration to real-time interception, risk scoring, and audit logging.
        </p>
      </div>

      {/* Responsive Horizontal Flow Track */}
      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="min-w-[1050px] relative px-6 py-12">

          {/* SVG Sinuous Wavy Dotted Path */}
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 1100 240"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* The Sine-Wave Dotted Curve */}
            <path
              d="M 20,120 
                 C 50,120 70,60 100,60 
                 C 130,60 160,180 190,180 
                 C 220,180 250,60 280,60 
                 C 310,60 340,180 370,180 
                 C 400,180 430,60 460,60 
                 C 490,60 520,180 550,180 
                 C 580,180 610,60 640,60 
                 C 670,60 700,180 730,180 
                 C 760,180 790,60 820,60 
                 C 850,60 880,180 910,180 
                 C 940,180 970,60 1000,60 
                 C 1030,60 1060,180 1080,180"
              stroke="#334155"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {/* Glowing Accent Stroke */}
            <path
              d="M 20,120 
                 C 50,120 70,60 100,60 
                 C 130,60 160,180 190,180 
                 C 220,180 250,60 280,60 
                 C 310,60 340,180 370,180 
                 C 400,180 430,60 460,60 
                 C 490,60 520,180 550,180 
                 C 580,180 610,60 640,60 
                 C 670,60 700,180 730,180 
                 C 760,180 790,60 820,60 
                 C 850,60 880,180 910,180 
                 C 940,180 970,60 1000,60 
                 C 1030,60 1060,180 1080,180"
              stroke="url(#flowGradient)"
              strokeWidth="2.5"
              strokeDasharray="4 8"
              strokeLinecap="round"
              className="opacity-75"
            />

            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="25%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="75%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* 12 Nodes Grid (Alternating High & Low with Text Labels) */}
          <div className="grid grid-cols-12 gap-3 relative z-10">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isTop = step.position === 'top';
              const isHovered = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  onMouseEnter={() => setActiveStep(step.id)}
                  onMouseLeave={() => setActiveStep(null)}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
                    isTop ? 'justify-start' : 'justify-end mt-16'
                  }`}
                >
                  {/* Top Text (for Top positioned nodes) */}
                  {isTop && (
                    <div className="text-center mb-3 min-h-[55px] flex flex-col justify-end px-1">
                      <h4 className="text-[11px] font-black text-slate-100 tracking-tight leading-tight">
                        {step.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 leading-tight mt-0.5 max-w-[85px] mx-auto line-clamp-2">
                        {step.subtitle}
                      </p>
                    </div>
                  )}

                  {/* Node Circle Badge */}
                  <div className="relative group my-1">
                    {/* Pulsing ring on active/hover */}
                    <div
                      className="absolute -inset-1.5 rounded-full transition-opacity duration-300 blur-sm"
                      style={{
                        backgroundColor: isHovered ? step.bgGlow : 'transparent',
                        opacity: isHovered ? 1 : 0
                      }}
                    />

                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-tr ${step.color} border-2 ${step.borderColor} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 relative`}
                      style={{
                        boxShadow: `0 4px 15px ${step.bgGlow}`
                      }}
                    >
                      <Icon className={`w-5 h-5 ${step.iconColor}`} />
                    </div>

                    {/* Step Number Bubble */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-bold text-slate-300 flex items-center justify-center">
                      {step.id}
                    </span>
                  </div>

                  {/* Bottom Text (for Bottom positioned nodes) */}
                  {!isTop && (
                    <div className="text-center mt-3 min-h-[55px] flex flex-col justify-start px-1">
                      <h4 className="text-[11px] font-black text-slate-100 tracking-tight leading-tight">
                        {step.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 leading-tight mt-0.5 max-w-[85px] mx-auto line-clamp-2">
                        {step.subtitle}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Active Step Detailed Card */}
      {activeStep !== null && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {(() => {
            const current = STEPS.find(s => s.id === activeStep)!;
            const Icon = current.icon;
            return (
              <>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${current.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Step {current.id}</span>
                    <span className="text-slate-600">·</span>
                    <h4 className="text-sm font-bold text-white">{current.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{current.subtitle}</p>
                </div>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
};
