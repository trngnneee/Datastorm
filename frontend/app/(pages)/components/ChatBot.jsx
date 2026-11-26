"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMotionTokens, useShouldReduceMotion } from "@animate-ui/react/utils/motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BotMessageSquare, SendHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Which category has the highest margin?",
  "Which stores have the most stock-outs?",
  "How does rain affect sales?",
];

function TypingDots() {
  const reduce = useShouldReduceMotion();
  if (reduce) return <span className="text-[13px] text-muted-foreground">Thinking…</span>;
  return (
    <span className="flex items-center gap-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/70"
          animate={{ opacity: [0.3, 1, 0.3], transform: ["translateY(0px)", "translateY(-3px)", "translateY(0px)"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const reduce = useShouldReduceMotion();
  const { spring, transition } = useMotionTokens();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }, [messages, loading, reduce]);

  const sendMessage = async (text) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", type: "text", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      }).then((r) => r.json());

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          type: "text",
          text:
            res?.code === "success"
              ? res.data.answer
              : "Sorry, I couldn't process your request. Please try again later.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", type: "text", text: "Sorry, an error occurred. Please try again later." },
      ]);
    }

    setLoading(false);
  };

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: transition.fade }
    : {
        initial: { opacity: 0, transform: "translateY(8px)" },
        animate: { opacity: 1, transform: "translateY(0px)" },
        transition: spring.pop,
      };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Ask the DataStorm assistant"
          className="fixed bottom-6 right-5 z-40 size-14 rounded-full p-0 shadow-lg shadow-primary/30 sm:right-6"
        >
          <BotMessageSquare className="size-6" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl p-0 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">DataStorm assistant</p>
            <p className="truncate text-xs text-muted-foreground">
              Ask about sales, stock or forecasts
            </p>
          </div>
        </div>

        <div className="flex h-[min(380px,55vh)] flex-col gap-3 overflow-y-auto px-4 py-4 scroll-thin" aria-live="polite">
          {messages.length === 0 && !loading ? (
            <div className="my-auto flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] text-muted-foreground">Try one of these:</p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="rounded-full border bg-card px-3 py-1.5 text-[13px] text-foreground/80 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((m, i) =>
              m.type === "text" ? (
                <motion.div
                  key={i}
                  {...enter}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "self-end rounded-br-md bg-primary text-primary-foreground"
                      : "self-start rounded-bl-md bg-muted text-foreground"
                  )}
                >
                  <span className="sr-only">{m.role === "user" ? "You:" : "Assistant:"}</span>
                  {m.role === "user" ? (
                    <p className="whitespace-pre-line">{m.text || m.message}</p>
                  ) : (
                    <div className="md-content text-[13px]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text || m.message}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {loading ? (
            <div className="self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-3">
              <TypingDots />
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <form
          className="flex items-center gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-xl border bg-card px-3 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="size-10 rounded-xl"
          >
            <SendHorizontal aria-hidden />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
