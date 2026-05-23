import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Send, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { askDocumentChat } from "@/lib/api/ai";
import { fetchDocumentLibrary } from "@/lib/api/doc-assistant";
import { getApiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

const SUGGESTION_KEYS = [
  "ai.suggestions.abnormal",
  "ai.suggestions.medicines",
  "ai.suggestions.sugar",
  "ai.suggestions.doctorAsk",
] as const;

type ChatTurn = {
  q: string;
  a: string;
  sources: { file: string; page: number; sourceType?: string }[];
  hasEnoughData?: boolean;
};

export function ReportChatPanel({ documentIds }: { documentIds?: string[] }) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);

  const { data: docs = [] } = useQuery({
    queryKey: ["doc-library"],
    queryFn: fetchDocumentLibrary,
  });

  const chatMutation = useMutation({
    mutationFn: (q: string) =>
      askDocumentChat({
        question: q,
        reportIds: documentIds,
        documentIds,
      }),
    onSuccess: (result, q) => {
      setHistory((h) => [
        ...h,
        {
          q,
          a: result.answer,
          sources: result.sources.map((s) => ({
            file: s.file,
            page: s.page,
            sourceType: s.sourceType,
          })),
          hasEnoughData: result.hasEnoughData,
        },
      ]);
      setQuestion("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not get an answer")),
  });

  const docCount = docs.length;
  const canChat = docCount > 0;

  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">{t("ai.docChatTitle")}</h3>
        </div>
        {docCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {t("ai.indexedDocs", { count: docCount })}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("ai.ragNote")}</p>

      {!canChat && (
        <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="text-muted-foreground">{t("ai.uploadPrompt")}</p>
          <Button variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
            <Link to="/patient/doc-assistant" search={{ tab: "upload" }}>
              <FileText className="mr-1 h-3 w-3" />
              {t("ai.goUpload")}
            </Link>
          </Button>
        </div>
      )}

      {canChat && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTION_KEYS.map((key) => (
            <Badge
              key={key}
              variant="secondary"
              className="cursor-pointer text-[11px] font-normal"
              onClick={() => !chatMutation.isPending && chatMutation.mutate(t(key))}
            >
              {t(key)}
            </Badge>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 max-h-80 space-y-4 overflow-y-auto">
          {history.map((item, i) => (
            <div key={i} className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">
                {t("ai.you")}: {item.q}
              </p>
              <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              {item.hasEnoughData === false && (
                <p className="text-[11px] text-amber-600">{t("ai.limitedMatches")}</p>
              )}
              {item.sources.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {t("ai.sources")}:{" "}
                  {item.sources
                    .slice(0, 4)
                    .map((s) => {
                      const tag = s.sourceType ? `${s.sourceType}:` : "";
                      return `${tag}${s.file} p.${s.page}`;
                    })
                    .join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = question.trim();
          if (q.length < 2 || !canChat) return;
          chatMutation.mutate(q);
        }}
      >
        <Input
          placeholder={canChat ? t("ai.askPlaceholder") : t("ai.placeholderDisabled")}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={chatMutation.isPending || !canChat}
        />
        <Button
          type="submit"
          size="icon"
          disabled={chatMutation.isPending || !canChat || question.trim().length < 2}
          aria-label={t("ai.send")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
