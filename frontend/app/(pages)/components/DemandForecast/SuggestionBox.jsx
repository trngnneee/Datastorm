"use client";

import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { Skeleton } from "@/components/dashboard/feedback";
import { Reveal } from "@/components/dashboard/reveal";

export const SuggestionBox = ({
  suggestion,
  loading = false,
  title = "AI recommendation",
  description = "Generated from the forecast below.",
}) => {
  return (
    <Panel className="h-full">
      <PanelHeader icon={Sparkles} title={title} description={description} />
      <div className="p-5" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-10/12" />
            <Skeleton className="h-3.5 w-9/12" />
            <Skeleton className="mt-2 h-3.5 w-10/12" />
            <Skeleton className="h-3.5 w-7/12" />
          </div>
        ) : suggestion ? (
          <Reveal key={suggestion.length}>
            <div className="md-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestion}</ReactMarkdown>
            </div>
          </Reveal>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Run a forecast to get a recommendation.
          </p>
        )}
      </div>
    </Panel>
  );
};
