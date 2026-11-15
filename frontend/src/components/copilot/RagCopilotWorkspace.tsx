// frontend/src/components/copilot/RagCopilotWorkspace.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  Flame,
  Info,
  Layers,
  Loader2,
  Quote,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useScenario } from '../../context/ScenarioContext';
import { MATERIALS_CATALOG } from '../../data/scenarioPresets';
import {
  buildContextualizedQuery,
  CatalogSourceStatus,
  fetchRagStatus,
  getCitationKind,
  getDynamicSuggestedQuestions,
  HealthStatus,
  queryRagCopilot,
  RagChatResponse,
  RagCitation,
  resolveSourceUrl,
} from '../../../services/ragService';

interface RagCopilotWorkspaceProps {
  variant?: 'embedded' | 'drawer';
  onCloseDrawer?: () => void;
}

/**
 * Hook de streaming progresivo palabra por palabra para dar sensación de respuesta inmediata
 */
function useWordStream(fullText: string, enabled: boolean, speedMs = 16) {
  const [displayed, setDisplayed] = useState(fullText);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!fullText || !enabled) {
      setDisplayed(fullText || '');
      setIsStreaming(false);
      return;
    }

    const words = fullText.split(' ');
    if (words.length <= 4) {
      setDisplayed(fullText);
      setIsStreaming(false);
      return;
    }

    let idx = 0;
    setDisplayed('');
    setIsStreaming(true);

    const timer = setInterval(() => {
      idx += 2; // Avanza de a 2 palabras cada 16ms (~125 palabras/seg)
      if (idx >= words.length) {
        setDisplayed(fullText);
        setIsStreaming(false);
        clearInterval(timer);
      } else {
        setDisplayed(words.slice(0, idx).join(' '));
      }
    }, speedMs);

    return () => clearInterval(timer);
  }, [fullText, enabled, speedMs]);

  const skipStream = () => {
    setDisplayed(fullText);
    setIsStreaming(false);
  };

  return { displayed, isStreaming, skipStream };
}

export const RagCopilotWorkspace: React.FC<RagCopilotWorkspaceProps> = ({
  variant = 'embedded',
}) => {
  const {
    lang,
    activeHabitat,
    conditions,
    selectedMaterial,
    activeMaterialEvaluation,
  } = useScenario();

  const [input, setInput] = useState('');
  const [includeScenarioContext, setIncludeScenarioContext] = useState(true);
  const [askedQuestion, setAskedQuestion] = useState('');
  const [response, setResponse] = useState<RagChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<0 | 1 | 2>(0);
  const [error, setError] = useState('');
  const [highlightedCitationIdx, setHighlightedCitationIdx] = useState<number | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthStatus | null>(null);
  const [catalogSource, setCatalogSource] = useState<CatalogSourceStatus | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const citationRefs = useRef<Record<number, HTMLDetailsElement | null>>({});

  const activeMaterialSpec = MATERIALS_CATALOG[selectedMaterial];

  // Cargar estado de conexión a Supabase / Catálogo PSI y modelo de síntesis al montar
  useEffect(() => {
    let mounted = true;
    fetchRagStatus().then(({ health, source }) => {
      if (!mounted) return;
      setHealthInfo(health);
      setCatalogSource(source);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Animación de las 3 etapas del pipeline RAG durante la consulta
  useEffect(() => {
    if (!loading) {
      setPipelineStage(0);
      return;
    }
    const t1 = setTimeout(() => setPipelineStage(1), 550);
    const t2 = setTimeout(() => setPipelineStage(2), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const suggestedQuestions = useMemo(
    () =>
      getDynamicSuggestedQuestions(
        activeHabitat,
        conditions,
        selectedMaterial,
        lang
      ),
    [activeHabitat, conditions, selectedMaterial, lang]
  );

  // Mapa rápido de ID de cita -> número [1..N]
  const citationIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    response?.citations?.forEach((c, idx) => {
      map[c.id] = idx + 1;
    });
    return map;
  }, [response]);

  // Streaming progresivo del Resumen Ejecutivo y de la Síntesis
  const execSummaryStream = useWordStream(
    response?.executive_summary || '',
    Boolean(response?.executive_summary),
    14
  );
  const mainAnswerStream = useWordStream(
    response?.answer || '',
    Boolean(response?.answer && (!response?.claims || response.claims.length === 0)),
    12
  );

  const executeQuestion = async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAskedQuestion(clean);
    setInput('');
    setError('');
    setResponse(null);
    setHighlightedCitationIdx(null);
    setLoading(true);

    const finalQuery = buildContextualizedQuery(
      clean,
      includeScenarioContext,
      activeHabitat,
      conditions,
      selectedMaterial,
      lang
    );

    try {
      const data = await queryRagCopilot({
        query: finalQuery,
        language: lang,
        limit: 6,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setResponse(data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err instanceof Error
            ? err.message
            : lang === 'en'
            ? 'Could not reach the RAG backend.'
            : 'No se pudo conectar con el motor RAG del backend.'
        );
      }
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeQuestion(input);
  };

  const jumpToCitation = (num: number) => {
    setHighlightedCitationIdx(num);
    const el = citationRefs.current[num];
    if (el) {
      el.open = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const renderCitationKindBadge = (cit: RagCitation) => {
    const kind = getCitationKind(cit.id);
    if (kind === 'psi_catalog') {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sky-300">
          <Database className="h-2.5 w-2.5" />
          PSI CATALOG
        </span>
      );
    }
    if (kind === 'background') {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-indigo-500/40 bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-300">
          <Info className="h-2.5 w-2.5" />
          NASA BRIEF
        </span>
      );
    }
    if (kind === 'catalog_summary') {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
          <Layers className="h-2.5 w-2.5" />
          MATRIZ MATERIALES
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">
        <FileText className="h-2.5 w-2.5" />
        PDF PAPER {cit.page > 0 ? `· PÁG. ${cit.page}` : ''}
      </span>
    );
  };

  return (
    <div
      className={`flex h-full flex-col bg-[#0A1224] text-slate-100 ${
        variant === 'embedded'
          ? 'w-full lg:w-[430px] xl:w-[460px] shrink-0 rounded-2xl border border-slate-800 shadow-2xl'
          : 'w-full'
      }`}
    >
      {/* 1. CABECERA CON ESTADO DE CONEXIÓN AL BACKEND Y SUPABASE */}
      <div className="flex items-center justify-between border-b border-slate-800/90 bg-[#080F1E] px-5 py-3.5 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/40 bg-gradient-to-br from-sky-500/20 to-blue-600/20 text-sky-400 shadow-inner">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Copilot SI</h3>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-sky-300">
                RAG + PSI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'en'
                ? 'Grounded in NASA PSI & peer-reviewed papers'
                : 'Respaldado por NASA PSI y papers científicos'}
            </p>
          </div>
        </div>

        {/* Indicador de Fuente de Datos (Supabase vs JSON Local) y Estado del LLM */}
        <div className="flex flex-col items-end gap-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-0.5 font-mono text-[9px] text-slate-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                healthInfo?.synthesis_ready
                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                  : healthInfo
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span>
              {catalogSource?.catalog === 'supabase'
                ? 'DB: SUPABASE'
                : 'DB: PSI LOCAL'}
            </span>
          </div>
          {healthInfo && !healthInfo.synthesis_ready && (
            <span className="font-mono text-[9px] text-amber-400">
              Modo solo-evidencia (Activa ENABLE_PAID_API=true)
            </span>
          )}
        </div>
      </div>

      {/* 2. BARRA DE CONTEXTO DEL ESCENARIO Y MATERIAL PRE-CARGADO */}
      <div className="border-b border-slate-800/80 bg-[#0D172A] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400">
            ⚡ {lang === 'en' ? 'ACTIVE SCENARIO & MATERIAL' : 'CONTEXTO DE ESCENARIO Y MATERIAL'}
          </span>

          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-300 select-none">
            <input
              type="checkbox"
              checked={includeScenarioContext}
              onChange={(e) => setIncludeScenarioContext(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-600 accent-sky-400"
            />
            <span>
              {lang === 'en' ? 'Inject into query' : 'Incluir en consulta'}
            </span>
          </label>
        </div>

        {/* Tarjeta resumen de condiciones + material */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#070D19] px-3 py-2 text-[11px]">
          <div>
            <strong className="text-white">{activeHabitat.name[lang]}</strong>
            <span className="ml-2 font-mono text-[10px] text-slate-400">
              {conditions.o2.toFixed(1)}% O₂ · {conditions.pressurePsi.toFixed(1)} psi ·{' '}
              {conditions.airflowCms.toFixed(1)} cm/s · {conditions.gravityG.toFixed(2)} g
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
              {activeMaterialSpec.shortName}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                activeMaterialEvaluation.burns
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {activeMaterialEvaluation.burns
                ? `${lang === 'en' ? 'Burns' : 'Arde'} +${activeMaterialEvaluation.burnMarginPts.toFixed(1)} pts`
                : lang === 'en'
                ? 'Safe'
                : 'Seguro'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. ÁREA CENTRAL DE CONVERSACIÓN Y VISUALIZACIÓN RAG */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
        {/* Estado inicial: Explicación + Preguntas sugeridas adaptadas al escenario */}
        {!askedQuestion && !loading && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800/90 bg-[#081020] p-4">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Zero-Hallucination Scientific RAG'
                    : 'RAG Científico con Validación Estricta de Citas'}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                {lang === 'en'
                  ? 'Every claim generated by the assistant is cross-checked by regex against verbatim quotes in our indexed PDFs and NASA PSI catalog. Unverified claims are automatically discarded.'
                  : 'Cada afirmación generada se valida contra citas textuales exactas (verbatim quotes) en los PDFs científicos y el catálogo NASA PSI. Cualquier dato sin respaldo directo se descarta automáticamente.'}
              </p>
            </div>

            <div>
              <span className="mb-2.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {lang === 'en'
                  ? `SUGGESTED FOR ${activeHabitat.name.en.toUpperCase()} & ${activeMaterialSpec.shortName}`
                  : `SUGERIDAS PARA ${activeHabitat.name.es.toUpperCase()} Y ${activeMaterialSpec.shortName}`}
              </span>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void executeQuestion(q)}
                    className="group flex items-start justify-between gap-2.5 rounded-xl border border-slate-800 bg-[#081020] p-3 text-left text-[11px] font-medium text-slate-200 transition-all hover:border-sky-500/50 hover:bg-[#0E1A32] hover:text-white"
                  >
                    <span className="leading-snug">{q}</span>
                    <span className="mt-0.5 font-mono text-sky-400 transition-transform group-hover:translate-x-0.5">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Burbuja de la pregunta realizada */}
        {askedQuestion && (
          <div className="rounded-xl border border-slate-700/80 bg-[#0F1B33] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-400">
                {lang === 'en' ? 'YOUR QUESTION' : 'CONSULTA ACTIVA'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAskedQuestion('');
                  setResponse(null);
                  setError('');
                }}
                className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                {lang === 'en' ? 'Reset' : 'Otra consulta'}
              </button>
            </div>
            <p className="mt-1 text-xs font-semibold text-white">{askedQuestion}</p>
          </div>
        )}

        {/* Stepper de Telemetría RAG en vivo mientras carga */}
        {loading && (
          <div className="rounded-xl border border-sky-500/30 bg-[#081020] p-4 space-y-3">
            <div className="flex items-center gap-2.5 text-sky-300 font-semibold">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              <span>
                {lang === 'en'
                  ? 'Executing Grounded RAG Pipeline...'
                  : 'Ejecutando Pipeline RAG Verificado...'}
              </span>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              {[
                lang === 'en'
                  ? '1. Searching PDF chunks + NASA PSI catalog (TF-IDF + Synonyms)'
                  : '1. Buscando en PDFs + catálogo NASA PSI (TF-IDF + Sinónimos)',
                lang === 'en'
                  ? '2. Synthesizing structured claims & executive summary'
                  : '2. Sintetizando afirmaciones y resumen ejecutivo con IA',
                lang === 'en'
                  ? '3. Verifying verbatim quotes & numerical grounding'
                  : '3. Validando citas literales (verbatim quotes) y cifras',
              ].map((stepText, idx) => {
                const isDone = pipelineStage > idx;
                const isCurrent = pipelineStage === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition ${
                      isCurrent
                        ? 'bg-sky-500/15 text-white border border-sky-500/30'
                        : isDone
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-slate-700" />
                    )}
                    <span>{stepText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alerta de Error de Red o Servidor */}
        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-rose-200">
            <div className="flex items-center gap-2 font-semibold text-rose-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{lang === 'en' ? 'Connection Error' : 'Error de Conexión'}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed">{error}</p>
          </div>
        )}

        {/* 4. RENDERIZADO RICO DE LA RESPUESTA DEL RAG */}
        {response && (
          <div className="space-y-3.5 animate-reveal">
            {/* Barra de metadatos de validación del RAG */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#070D19] px-3 py-1.5 font-mono text-[10px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {response.mode === 'evidence_only'
                    ? lang === 'en'
                      ? 'EVIDENCE ONLY MODE'
                      : 'MODO SOLO EVIDENCIA'
                    : lang === 'en'
                    ? `${response.claims?.length || 0} VERIFIED CLAIMS · ${response.citations.length} SOURCES`
                    : `${response.claims?.length || 0} AFIRMACIONES VALIDADAS · ${response.citations.length} FUENTES`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                {response.usage?.cached && (
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] text-emerald-300">
                    ⚡ CACHE HIT (0ms)
                  </span>
                )}
                {(execSummaryStream.isStreaming || mainAnswerStream.isStreaming) && (
                  <button
                    type="button"
                    onClick={() => {
                      execSummaryStream.skipStream();
                      mainAnswerStream.skipStream();
                    }}
                    className="text-sky-400 underline hover:text-sky-300"
                  >
                    {lang === 'en' ? 'Show all' : 'Mostrar todo'}
                  </button>
                )}
              </div>
            </div>

            {/* BLOQUE A: RESUMEN EJECUTIVO (Decision-Maker Bottom Line) */}
            {response.executive_summary && (
              <div className="rounded-xl border border-sky-400/50 bg-gradient-to-br from-sky-500/15 via-[#0E1B36] to-[#091224] p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300">
                    <Zap className="h-3.5 w-3.5 text-sky-400" />
                    {lang === 'en'
                      ? 'EXECUTIVE DECISION SUMMARY'
                      : 'RESUMEN EJECUTIVO PARA TOMA DE DECISIONES'}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium leading-relaxed text-white">
                  {execSummaryStream.displayed}
                  {execSummaryStream.isStreaming && (
                    <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-sky-400 align-middle" />
                  )}
                </p>
              </div>
            )}

            {/* BLOQUE B: ALERTA DE FÍSICA CONTRAINTUITIVA EN MICROGRAVEDAD */}
            {response.physical_alert && (
              <div className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-amber-950/25 to-[#0B1324] p-3.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    {lang === 'en'
                      ? 'Counter-Intuitive Microgravity Physics Alert'
                      : 'Alerta de Física Contraintuitiva en Microgravedad'}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-amber-100">
                  {response.physical_alert}
                </p>
                {response.physical_alert_claim?.quote && (
                  <blockquote className="mt-2 border-l-2 border-amber-400/50 pl-2.5 font-mono text-[10px] italic text-amber-200/80">
                    “{response.physical_alert_claim.quote}”
                  </blockquote>
                )}
              </div>
            )}

            {/* BLOQUE C: DESGLOSE DE AFIRMACIONES VERIFICADAS CON CITA LITERAL (O RESPUESTA GENERAL) */}
            <div className="rounded-xl border border-slate-800 bg-[#081020] p-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {response.claims && response.claims.length > 0
                  ? lang === 'en'
                    ? 'EVIDENCE-BACKED CLAIMS & VERBATIM QUOTES'
                    : 'HALLAZGOS VERIFICADOS Y CITAS LITERALES'
                  : lang === 'en'
                  ? 'SYNTHESIS'
                  : 'SÍNTESIS'}
              </span>

              {response.claims && response.claims.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {response.claims.map((claim, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800/90 bg-[#0B1528] p-3 transition hover:border-slate-700"
                    >
                      <p className="text-xs leading-relaxed text-slate-100">
                        {claim.text}
                      </p>

                      {/* Extracto textual exacto validado por el servidor (source_quote) */}
                      {claim.quote && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#060C18] p-2.5 border border-slate-800/80">
                          <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400/70" />
                          <p className="font-mono text-[10px] leading-relaxed text-slate-300">
                            “{claim.quote}”
                          </p>
                        </div>
                      )}

                      {/* Botones interactivos que saltan a la fuente citada */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[9px] text-slate-500">
                          {lang === 'en' ? 'Verified in:' : 'Verificado en:'}
                        </span>
                        {claim.citation_ids.map((cid) => {
                          const num = citationIndexMap[cid];
                          return (
                            <button
                              key={cid}
                              type="button"
                              onClick={() => num && jumpToCitation(num)}
                              className="inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 transition hover:bg-sky-500/25 hover:text-white"
                            >
                              <span>[{num || cid}]</span>
                              <span>{cid.replace(/^psi:/, '')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-200">
                  {mainAnswerStream.displayed}
                </p>
              )}
            </div>

            {/* BLOQUE D: TARJETAS DE FUENTES Y CITAS TRAZABLES */}
            {response.citations.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-[#081020] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'en'
                      ? `TRACEABLE SOURCES (${response.citations.length})`
                      : `FUENTES TRAZABLES (${response.citations.length})`}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">
                    {lang === 'en' ? 'Click to inspect excerpt' : 'Clic para ver pasaje original'}
                  </span>
                </div>

                <div className="mt-2.5 space-y-2">
                  {response.citations.map((cit, i) => {
                    const num = i + 1;
                    const isHighlighted = highlightedCitationIdx === num;
                    const resolvedUrl = resolveSourceUrl(cit.url);

                    return (
                      <details
                        key={cit.id}
                        ref={(el) => {
                          citationRefs.current[num] = el;
                        }}
                        className={`group rounded-xl border p-3 transition-all ${
                          isHighlighted
                            ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                            : 'border-slate-800 bg-[#050B16] hover:border-slate-700'
                        }`}
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sky-500/20 font-mono text-[10px] font-bold text-sky-300 border border-sky-500/30">
                              {num}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {renderCitationKindBadge(cit)}
                                {cit.relevance > 0 && (
                                  <span className="font-mono text-[9px] text-slate-500">
                                    score {cit.relevance.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <strong className="mt-1 block text-[11px] font-semibold text-white">
                                {cit.title}
                              </strong>
                              <span className="block text-[10px] text-slate-400">
                                {cit.source_file}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
                        </summary>

                        <blockquote className="mt-2.5 whitespace-pre-wrap rounded-lg border-l-2 border-sky-400 bg-[#0A1326] p-2.5 font-mono text-[10px] leading-relaxed text-slate-300">
                          {cit.text}
                        </blockquote>

                        {resolvedUrl && (
                          <div className="mt-2 flex justify-end">
                            <a
                              href={resolvedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-sky-300 transition hover:bg-sky-500/20 hover:text-white"
                            >
                              <span>
                                {cit.page > 0
                                  ? lang === 'en'
                                    ? `Open original PDF at page ${cit.page}`
                                    : `Abrir PDF original en pág. ${cit.page}`
                                  : lang === 'en'
                                  ? 'Open official PSI source'
                                  : 'Abrir fuente oficial PSI'}
                              </span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </details>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BLOQUE E: CONFLICTOS Y LIMITACIONES CIENTÍFICAS */}
            {response.conflicts.length > 0 && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-rose-200">
                <strong className="block font-mono text-[10px] uppercase tracking-wider text-rose-300">
                  {lang === 'en' ? 'CONFLICTING EVIDENCE DETECTED' : 'EVIDENCIA EN CONFLICTO DETECTADA'}
                </strong>
                {response.conflicts.map((c, idx) => (
                  <p key={idx} className="mt-1 text-[11px] leading-relaxed">
                    {c}
                  </p>
                ))}
              </div>
            )}

            {response.limitations.length > 0 && (
              <details className="rounded-xl border border-slate-800 bg-[#070D19] p-3 text-slate-400">
                <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  {lang === 'en'
                    ? `Scientific & Corpus Limitations (${response.limitations.length})`
                    : `Limitaciones Científicas y del Corpus (${response.limitations.length})`}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                  {response.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </details>
            )}

            {/* Chips rápidos para seguir explorando */}
            <div className="pt-1">
              <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {lang === 'en' ? 'FOLLOW-UP QUESTIONS' : 'SEGUIR EXPLORANDO'}
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestedQuestions
                  .filter((q) => q !== askedQuestion)
                  .slice(0, 2)
                  .map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void executeQuestion(q)}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#070D19] px-3 py-2 text-left text-[11px] text-slate-300 transition hover:border-sky-500/40 hover:text-white"
                    >
                      <span className="truncate">{q}</span>
                      <span className="ml-2 text-sky-400">↗</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. FORMULARIO DE ENTRADA CON ENVÍO AL MOTOR RAG */}
      <form
        onSubmit={handleFormSubmit}
        className="border-t border-slate-800/90 bg-[#080F1E] p-3.5 rounded-b-2xl"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            maxLength={2000}
            placeholder={
              lang === 'en'
                ? `Ask about ${activeMaterialSpec.shortName} in ${activeHabitat.name.en}...`
                : `Pregunta sobre ${activeMaterialSpec.shortName} en ${activeHabitat.name.es}...`
            }
            className="w-full rounded-xl border border-slate-700 bg-[#050A14] py-3 pl-3.5 pr-11 text-xs text-white placeholder-slate-500 outline-none transition focus:border-sky-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={lang === 'en' ? 'Send question' : 'Enviar pregunta'}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400 text-slate-950 shadow-sm transition hover:bg-sky-300 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            {lang === 'en'
              ? 'Strict verbatim quote validation active'
              : 'Validación estricta de citas literales activa'}
          </span>
          <span className="font-mono text-[9px] text-slate-600">POST /api/chat</span>
        </div>
      </form>
    </div>
  );
};