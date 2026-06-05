"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import Step1Intent from "./Step1Intent";
import Step2Sources from "./Step2Sources";
import Step3AIReview from "./Step3AIReview";
import Step4Confirm from "./Step4Confirm";
import { SourceConfig, CreateTopicData } from "@/types/lockedTopic";

export default function CreateTopicModal({
  trigger,
  initialData,
  topicId,
}: {
  trigger?: React.ReactNode;
  initialData?: CreateTopicData;
  topicId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CreateTopicData>(
    initialData || {
      displayName: "",
      userContext: "",
      sources: [] as SourceConfig[],
      aiRefinedQuery: "",
      aiQuerySummary: "",
      suggestedSources: [] as unknown[],
    },
  );

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const reset = () => {
    setOpen(false);
    // Use a small timeout to let the modal finish closing animation before resetting state
    setTimeout(() => {
      setStep(1);
      if (!initialData) {
        setData({
          displayName: "",
          userContext: "",
          sources: [],
          aiRefinedQuery: "",
          aiQuerySummary: "",
          suggestedSources: [],
        });
      } else {
        setData(initialData);
      }
    }, 3000);
  };

  const isEdit = !!topicId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="lg"
            className="gap-2 rounded-xl px-6 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <HugeiconsIcon icon={Add01Icon} size={20} />
            Lock New Topic
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 border border-secondary shadow-2xl bg-background/95 backdrop-blur-xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-8 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-black tracking-tight">
                {isEdit ? "Edit" : "Lock New"}{" "}
                <span className="text-primary">Topic</span>
              </DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">
                Step {step} of 4: {getStepTitle(step)}
              </p>
            </div>
          </div>
          <div className="w-full bg-secondary h-1.5 mt-8 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div className="p-8 overflow-y-auto flex-1 no-scrollbar">
          {step === 1 && (
            <Step1Intent data={data} setData={setData} onNext={nextStep} />
          )}
          {step === 2 && (
            <Step2Sources
              data={data}
              setData={setData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {step === 3 && (
            <Step3AIReview
              data={data}
              setData={setData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {step === 4 && (
            <Step4Confirm
              data={data}
              onPrev={prevStep}
              onComplete={reset}
              topicId={topicId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStepTitle(step: number) {
  switch (step) {
    case 1:
      return "Define Intent";
    case 2:
      return "Select Sources";
    case 3:
      return "AI Review";
    case 4:
      return "Surveillance Ready";
    default:
      return "";
  }
}
