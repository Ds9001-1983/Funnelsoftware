import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ApiError, apiRequest } from "@/lib/queryClient";

export function GlobalErrorHandler() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const handledIds = useRef<Set<string>>(new Set());
  const checkoutInFlight = useRef(false);

  useEffect(() => {
    const startCheckout = async () => {
      if (checkoutInFlight.current) return;
      checkoutInFlight.current = true;
      try {
        const res = await apiRequest("POST", "/api/billing/create-checkout");
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        navigate("/settings#billing");
      } catch {
        navigate("/settings#billing");
      } finally {
        checkoutInFlight.current = false;
      }
    };

    const handleError = (error: unknown, mutationId: string) => {
      if (!(error instanceof ApiError)) return;
      if (handledIds.current.has(mutationId)) return;

      // Legacy-Fallback: alte Sessions können den Code noch liefern.
      if (error.code === "TRIAL_EXPIRED") {
        handledIds.current.add(mutationId);
        toast({
          title: "Testzeitraum abgelaufen",
          description:
            "Dein Trial ist vorbei. Wir leiten dich zur Zahlungsseite weiter …",
          variant: "destructive",
        });
        startCheckout();
        return;
      }

      if (error.code === "PRO_REQUIRED") {
        handledIds.current.add(mutationId);
        toast({
          title: "Pro-Funktion",
          description:
            "Diese Funktion ist im Pro-Plan enthalten (49 €/Monat). Wir leiten dich zum Upgrade weiter …",
          variant: "destructive",
        });
        startCheckout();
        return;
      }

      if (error.code === "FREE_LIMIT_REACHED") {
        handledIds.current.add(mutationId);
        toast({
          title: "Free-Limit erreicht",
          description:
            error.message ||
            "Dein Free-Plan-Limit ist erreicht. Upgrade auf Pro für unbegrenzte Funnels und Leads.",
          variant: "destructive",
        });
        return;
      }

      if (error.code === "EMAIL_NOT_VERIFIED") {
        handledIds.current.add(mutationId);
        toast({
          title: "E-Mail noch nicht bestätigt",
          description:
            "Bitte bestätige zuerst deine E-Mail-Adresse, um fortzufahren.",
          variant: "destructive",
        });
        navigate("/verify-email");
      }
    };

    const unsubMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== "updated") return;
      const mutation = event.mutation;
      if (mutation.state.status !== "error") return;
      handleError(mutation.state.error, String(mutation.mutationId));
    });

    const unsubQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated") return;
      const query = event.query;
      if (query.state.status !== "error") return;
      handleError(query.state.error, query.queryHash);
    });

    return () => {
      unsubMutations();
      unsubQueries();
    };
  }, [queryClient, toast, navigate]);

  return null;
}
