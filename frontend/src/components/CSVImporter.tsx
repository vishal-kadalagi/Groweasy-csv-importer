'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Download, FileSpreadsheet, RefreshCw, Sparkles } from 'lucide-react';
import axios from 'axios';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

export default function CSVImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'uploading' | 'preview' | 'processing' | 'result'>('upload');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [resultData, setResultData] = useState<{ extracted: any[], skipped: any[] }>({ extracted: [], skipped: [] });
  const [error, setError] = useState<string>('');
  
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [retryStatus, setRetryStatus] = useState<string>('');

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv')) {
      await processUpload(droppedFile);
    } else {
      setError('Please upload a valid .csv file.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
         await processUpload(selectedFile);
      } else {
         setError('Please upload a valid .csv file.');
      }
    }
  };

  const processUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError('');
    setStep('uploading');
    
    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await axios.post('http://localhost:3001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.records) {
        setPreviewData(res.data.records);
        setTimeout(() => setStep('preview'), 800);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to parse CSV file on backend.');
      setStep('upload');
    }
  };

  const confirmImport = async () => {
    setStep('processing');
    setTotalCount(previewData.length);
    setProcessedCount(0);
    setResultData({ extracted: [], skipped: [] });
    setError('');
    setRetryStatus('');

    const batchSize = 10;
    let allExtracted: any[] = [];
    let allSkipped: any[] = [];
    let hasFatalError = false;

    for (let i = 0; i < previewData.length; i += batchSize) {
      if (hasFatalError) break;
      
      const batch = previewData.slice(i, i + batchSize);
      let success = false;
      let attempts = 0;
      const maxRetries = 3;

      while (!success && attempts < maxRetries) {
        try {
          if (attempts > 0) setRetryStatus(`Network glitch. Retrying batch (Attempt ${attempts + 1}/${maxRetries})...`);
          
          const res = await axios.post('http://localhost:3001/api/extract', { records: batch });
          
          allExtracted = [...allExtracted, ...(res.data.extracted || [])];
          allSkipped = [...allSkipped, ...(res.data.skipped || [])];
          
          success = true;
          setRetryStatus('');
        } catch (err: any) {
          attempts++;
          if (attempts >= maxRetries) {
            hasFatalError = true;
            setError(`AI Extraction failed after ${maxRetries} retries. Please check your Gemini API key in backend/.env`);
          }
          await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
        }
      }
      
      if (success) {
        setProcessedCount(Math.min(i + batchSize, previewData.length));
        setResultData({ extracted: allExtracted, skipped: allSkipped });
      }
    }

    setStep('result');
  };

  const downloadTemplate = () => {
    const csvContent = "created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description\n2026-05-13 14:20:48,John Doe,john@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,owner@groweasy.ai,GOOD_LEAD_FOLLOW_UP,Sample Note,leads_on_demand,Q4 2026,";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "GrowEasy_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewKeys = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  // Row renderer for Preview Table
  const PreviewRow = ({ index, style }: { index: number, style: any }) => {
    const row = previewData[index];
    return (
      <div style={style} className={`flex items-center px-6 border-b border-neutral-800/50 hover:bg-neutral-800/40 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-neutral-900/20'}`}>
        <div className="w-16 font-mono text-neutral-500 shrink-0">{index + 1}</div>
        {previewKeys.map((key, j) => (
          <div key={j} className="flex-1 w-48 shrink-0 px-4 truncate text-neutral-300 font-medium" title={row[key]}>
            {row[key] || <span className="text-neutral-600">-</span>}
          </div>
        ))}
      </div>
    );
  };

  // Row renderer for Result Table
  const ResultRow = ({ index, style }: { index: number, style: any }) => {
    const row = resultData.extracted[index];
    return (
      <div style={style} className={`flex items-center px-8 border-b border-neutral-800/50 hover:bg-neutral-800/40 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-neutral-900/20'}`}>
        <div className="flex-1 w-48 shrink-0 px-2 font-bold text-white truncate">{row.name || <span className="text-neutral-600 font-normal">N/A</span>}</div>
        <div className="flex-1 w-48 shrink-0 px-2 text-neutral-300 truncate">{row.email || <span className="text-neutral-600">-</span>}</div>
        <div className="flex-1 w-40 shrink-0 px-2 text-neutral-300 font-mono text-xs truncate">{(row.country_code ? row.country_code + ' ' : '') + (row.mobile_without_country_code || '-')}</div>
        <div className="w-48 shrink-0 px-2">
          {row.crm_status ? (
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-500/20 whitespace-nowrap tracking-wide">
              {row.crm_status}
            </span>
          ) : <span className="text-neutral-600">-</span>}
        </div>
        <div className="flex-2 w-64 shrink-0 px-2 text-neutral-400 truncate" title={row.crm_note}>{row.crm_note || <span className="text-neutral-600">-</span>}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 p-8 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        <header className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl text-black shadow-lg shadow-emerald-500/20">
                <Sparkles size={24} className="animate-pulse" />
              </span>
              GrowEasy
            </h1>
            <p className="text-neutral-400 mt-2 text-lg">AI-Powered CSV Lead Importer</p>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-red-500/5 backdrop-blur-md animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-[3px] border-dashed border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-500 rounded-[2.5rem] p-24 flex flex-col items-center justify-center text-center group cursor-pointer bg-neutral-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-950/50 pointer-events-none" />
              
              <div className="bg-neutral-900 group-hover:bg-emerald-500/20 p-6 rounded-full transition-all duration-500 mb-8 shadow-2xl shadow-black/50 group-hover:scale-110 group-hover:shadow-emerald-500/20 z-10">
                <UploadCloud size={56} className="text-neutral-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-white z-10">Drag & Drop your CSV file here</h3>
              <p className="text-neutral-400 mb-10 max-w-lg text-lg leading-relaxed z-10">
                Our AI will automatically extract and map your unstructured custom columns to GrowEasy's required CRM format.
              </p>
              
              <div className="flex gap-4 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-4 rounded-full font-medium transition-all flex items-center gap-2 hover:shadow-lg"
                >
                  <Download size={18} />
                  Sample Template
                </button>
                <label className="bg-white hover:bg-neutral-200 hover:scale-105 active:scale-95 text-black px-10 py-4 rounded-full font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xl shadow-white/10">
                  <FileSpreadsheet size={20} />
                  Browse Files
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <div className="flex flex-col items-center justify-center py-40 space-y-8 bg-neutral-900/40 rounded-[3rem] border border-neutral-800 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
              <Loader2 size={80} className="text-emerald-500 animate-spin relative" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-3 text-white">Uploading CSV</h2>
              <p className="text-neutral-400 text-lg">Securely transferring and parsing your file in memory...</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-neutral-900/60 p-6 rounded-[2rem] border border-neutral-800 shadow-2xl backdrop-blur-2xl">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-white">Preview Data</h2>
                <p className="text-neutral-400 mt-1 text-sm">
                  <span className="text-white font-semibold bg-neutral-800 px-2 py-0.5 rounded-md mr-1">{previewData.length}</span> 
                  rows detected in <span className="text-emerald-400 ml-1">{file?.name}</span>
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setStep('upload'); setFile(null); setPreviewData([]); }}
                  className="bg-neutral-800/80 hover:bg-neutral-700 text-white px-6 py-3 rounded-full font-medium transition-all hover:shadow-lg border border-neutral-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmImport}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black px-8 py-3 rounded-full font-bold transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  Confirm & Map with AI
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-900/40 rounded-[2rem] border border-neutral-800 overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col h-[600px]">
              <div className="flex items-center px-6 py-4 bg-neutral-950/90 border-b border-neutral-800 z-10 sticky top-0">
                <div className="w-16 font-bold tracking-widest text-neutral-400 text-xs uppercase shrink-0">#</div>
                {previewKeys.map((key, i) => (
                  <div key={i} className="flex-1 w-48 shrink-0 px-4 font-bold tracking-widest text-neutral-400 text-xs uppercase truncate">
                    {key}
                  </div>
                ))}
              </div>
              <div style={{ height: 550, width: '100%' }}>
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      height={height}
                      itemCount={previewData.length}
                      itemSize={60}
                      width={width}
                      className="custom-scrollbar"
                    >
                      {PreviewRow}
                    </List>
                  )}
                </AutoSizer>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col items-center justify-center py-20 px-8 bg-neutral-900/60 rounded-[3rem] border border-neutral-800 shadow-2xl backdrop-blur-2xl">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                <div className="bg-neutral-900 p-6 rounded-full border border-neutral-800 shadow-2xl relative z-10">
                   <RefreshCw size={48} className="text-emerald-500 animate-spin" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-white">AI is extracting CRM fields</h2>
              <p className="text-neutral-400 text-lg mb-10 max-w-xl text-center">
                Gemini is intelligently parsing each row and mapping custom columns to GrowEasy CRM format...
              </p>

              <div className="w-full max-w-2xl bg-neutral-950 rounded-full h-4 mb-4 overflow-hidden border border-neutral-800 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-4 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${Math.max(5, (processedCount / totalCount) * 100)}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]" />
                </div>
              </div>
              
              <div className="flex justify-between w-full max-w-2xl text-sm font-medium">
                <span className="text-emerald-400 animate-pulse">{Math.round((processedCount / totalCount) * 100)}% Complete</span>
                <span className="text-neutral-400">{processedCount} / {totalCount} rows processed</span>
              </div>

              {retryStatus && (
                <div className="mt-6 text-amber-400 flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20 animate-in fade-in">
                  <AlertCircle size={16} /> {retryStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900/60 border border-neutral-800 p-8 rounded-[2rem] flex items-center gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-lg">
                  <CheckCircle className="text-emerald-500" size={36} />
                </div>
                <div className="z-10">
                  <p className="text-neutral-400 font-medium text-sm tracking-wider uppercase mb-1">Imported</p>
                  <p className="text-5xl font-black text-white">{resultData.extracted.length}</p>
                </div>
              </div>
              
              <div className="bg-neutral-900/60 border border-neutral-800 p-8 rounded-[2rem] flex items-center gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] bg-red-500/5 blur-3xl group-hover:bg-red-500/10 transition-colors" />
                <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 shadow-lg">
                  <AlertCircle className="text-red-500" size={36} />
                </div>
                <div className="z-10">
                  <p className="text-neutral-400 font-medium text-sm tracking-wider uppercase mb-1">Skipped</p>
                  <p className="text-5xl font-black text-white">{resultData.skipped.length}</p>
                </div>
              </div>

              <div className="flex flex-col justify-center bg-neutral-900/40 border border-neutral-800 p-8 rounded-[2rem] shadow-2xl backdrop-blur-xl">
                <button 
                  onClick={() => { setStep('upload'); setFile(null); setPreviewData([]); setResultData({extracted:[], skipped:[]})}}
                  className="bg-white hover:bg-neutral-200 hover:scale-[1.02] active:scale-95 text-black px-8 py-5 rounded-2xl font-bold transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                >
                  <UploadCloud size={20} />
                  Import Another CSV
                </button>
              </div>
            </div>

            {/* Extracted Records Table - Virtualized */}
            <div className="bg-neutral-900/60 rounded-[2rem] border border-neutral-800 overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col h-[500px]">
              <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/80 shrink-0">
                <div>
                  <h3 className="font-bold text-2xl text-white flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" size={24} />
                    Extracted CRM Records
                  </h3>
                  <p className="text-neutral-400 mt-1">Successfully mapped to GrowEasy fields</p>
                </div>
              </div>
              
              <div className="flex items-center px-8 py-4 bg-neutral-950/95 border-b border-neutral-800 shrink-0">
                <div className="flex-1 w-48 shrink-0 px-2 font-bold tracking-widest text-neutral-400 text-xs uppercase">Name</div>
                <div className="flex-1 w-48 shrink-0 px-2 font-bold tracking-widest text-neutral-400 text-xs uppercase">Email</div>
                <div className="flex-1 w-40 shrink-0 px-2 font-bold tracking-widest text-neutral-400 text-xs uppercase">Mobile</div>
                <div className="w-48 shrink-0 px-2 font-bold tracking-widest text-neutral-400 text-xs uppercase">Status</div>
                <div className="flex-2 w-64 shrink-0 px-2 font-bold tracking-widest text-neutral-400 text-xs uppercase">Note</div>
              </div>
              
              <div style={{ height: 450, width: '100%' }}>
                {resultData.extracted.length > 0 ? (
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        itemCount={resultData.extracted.length}
                        itemSize={60}
                        width={width}
                        className="custom-scrollbar"
                      >
                        {ResultRow}
                      </List>
                    )}
                  </AutoSizer>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500 text-lg">No records successfully extracted.</div>
                )}
              </div>
            </div>
            
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}} />
    </div>
  );
}
