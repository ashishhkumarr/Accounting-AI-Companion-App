"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface ParsedFields {
  vendor?: string;
  date?: string;
  amount?: string;
  description?: string;
  category?: string;
  memo?: string;
  confidence?: string;
}

// 💡 New: simple types for our upload history (frontend-only)
type UploadStatus = "parsed" | "error";

interface UploadRecord {
  id: string;
  filename: string;
  uploadedAt: string; // ISO string
  status: UploadStatus;
  message?: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedFields, setParsedFields] = useState<ParsedFields | null>(null);
  const [sampleText, setSampleText] = useState("");
  const [error, setError] = useState("");
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [message, setMessage] = useState("");

  // 💡 New: purely frontend session upload history
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      // Reset previous parse state
      setParsedFields(null);
      setSampleText("");
      setError("");
      setMessage("");
      setAiEnhanced(false);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use AI-enhanced endpoint (existing backend integration)
      const resp = await api.postFormData<any>("/parse/ai", formData);

      setParsedFields(resp.parsed_fields || {});
      setSampleText(resp.sample_text || "");
      setAiEnhanced(resp.ai_enhanced || false);
      setMessage(resp.message || "");

      // 💡 New: record successful upload in local history (frontend-only)
      setUploadHistory((prev) => [
        {
          id: `${Date.now()}-${file.name}`,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          status: "parsed",
          message: resp.message || "Parsed successfully",
        },
        ...prev, // newest first
      ]);
    } catch (err: any) {
      const errMsg = `Upload failed: ${
        err?.response?.data?.detail || err.message || "Unknown error"
      }`;
      setError(errMsg);

      // 💡 New: record failed upload in local history as well
      if (file) {
        setUploadHistory((prev) => [
          {
            id: `${Date.now()}-${file.name}`,
            filename: file.name,
            uploadedAt: new Date().toISOString(),
            status: "error",
            message: "Failed to parse",
          },
          ...prev,
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDraftExpense = () => {
    if (parsedFields) {
      // Store AI-enhanced parsed fields in sessionStorage
      sessionStorage.setItem(
        "draftExpense",
        JSON.stringify({
          vendor_name: parsedFields.vendor || "",
          amount: parsedFields.amount || "",
          date:
            parsedFields.date ||
            new Date().toISOString().split("T")[0],
          category: parsedFields.category || "",
          memo: parsedFields.memo || parsedFields.description || "",
        })
      );
      router.push("/expenses");
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload Receipt
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              AI-powered OCR extracts and enhances expense data automatically
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-50 to-purple-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:from-brand-900/20 dark:to-purple-900/20 dark:text-brand-300">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            OCR + AI
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">
              Select File (PNG, JPG, PDF, CSV)
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.csv"
              onChange={handleFileChange}
              className="block w-full cursor-pointer text-sm text-gray-500
                file:mr-4 file:cursor-pointer file:rounded-md file:border-0
                file:bg-primary-50 file:px-4 file:py-2 file:text-sm
                file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {/* 💡 New: richer client-side metadata preview */}
          {file && (
            <div className="inline-flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:bg-neutral-900/40 dark:text-gray-200">
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V9.5L14.5 7H9a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Selected file
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {file.name}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {(file.type || "Unknown type")} •{" "}
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="btn btn-primary"
            aria-label="Upload and parse receipt"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {loading ? "Processing with AI..." : "Upload & Parse"}
          </button>

          {message && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                aiEnhanced
                  ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
              }`}
            >
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <svg
                className="h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {parsedFields && (
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                AI-Enhanced Results
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {aiEnhanced
                  ? "Cleaned and categorized by AI"
                  : "Basic OCR extraction"}
              </p>
            </div>
            {parsedFields.confidence && (
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                  parsedFields.confidence === "high"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : parsedFields.confidence === "medium"
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    parsedFields.confidence === "high"
                      ? "bg-green-500"
                      : parsedFields.confidence === "medium"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
                {parsedFields.confidence} confidence
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Vendor
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                {parsedFields.vendor || "Not detected"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Amount
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                {parsedFields.amount ? `$${parsedFields.amount}` : "Not detected"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Date
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                {parsedFields.date || "Not detected"}
              </div>
            </div>

            {parsedFields.category && (
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Category
                </div>
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm font-medium text-brand-900 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-100">
                  {parsedFields.category}
                </div>
              </div>
            )}

            {parsedFields.memo && (
              <div className="md:col-span-2 space-y-1">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Memo
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                  {parsedFields.memo}
                </div>
              </div>
            )}
          </div>

          {sampleText && (
            <div className="mt-4">
              <div className="label">Sample Text (first 500 chars)</div>
              <div className="max-h-48 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs">
                {sampleText}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button onClick={handleDraftExpense} className="btn btn-primary">
              Draft Expense with These Fields
            </button>
          </div>
        </div>
      )}

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="mb-2 font-semibold text-blue-900">
          Supported Formats
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
          <li>Images: PNG, JPG (OCR extraction using EasyOCR)</li>
          <li>Documents: PDF (text and image extraction)</li>
          <li>Spreadsheets: CSV (structured data parsing)</li>
        </ul>
      </div>

      {/* 💡 New: Upload history card (frontend-only, session-based) */}
      {uploadHistory.length > 0 && (
        <div className="card border-slate-200 bg-white">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">
            This session&apos;s uploads
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            A quick overview of the receipts you&apos;ve parsed during this
            session. This is stored only in the browser state and resets when
            you refresh.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="py-2 pr-4">File name</th>
                  <th className="py-2 pr-4">Uploaded at</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-50 last:border-b-0"
                  >
                    <td className="py-2 pr-4 text-slate-900">
                      {record.filename}
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {new Date(record.uploadedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " +
                          (record.status === "parsed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700")
                        }
                      >
                        {record.status === "parsed" ? "Parsed" : "Error"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {record.message || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}