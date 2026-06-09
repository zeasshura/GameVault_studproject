import React, { useState } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import { gamesApi } from '../../api/games';
import type { ImportReport } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const CsvUploadTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setReport(null);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await gamesApi.uploadCsv(formData);
      setReport(result);
    } catch {
      setError('Ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-400" />
          Загрузка CSV / XML
        </h2>

        <form onSubmit={handleUpload} className="space-y-5" id="csv-upload-form">
          <div>
            <label htmlFor="csv-file-input" className="block text-sm font-medium text-gray-300 mb-3">
              Выберите файл
            </label>
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                file
                  ? 'border-primary-500/50 bg-primary-500/5'
                  : 'border-white/10 hover:border-primary-500/30'
              }`}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,.xml"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer">
                <FileUp className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-primary-400' : 'text-gray-600'}`} />
                {file ? (
                  <>
                    <p className="text-primary-300 font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 font-medium">Перетащите файл или нажмите</p>
                    <p className="text-xs text-gray-600 mt-1">CSV или XML, до 10 MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            id="csv-upload-btn"
            disabled={!file || loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
            Загрузить
          </button>
        </form>

        {report && (
          <div className="mt-6 p-5 bg-dark-50/50 rounded-xl border border-white/10 animate-fade-in">
            <h3 className="font-semibold text-white mb-3">Отчёт об импорте</h3>
            <div className="flex gap-4 mb-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-bold">{report.success_count}</span>
                <span className="text-sm">успешно</span>
              </div>
              {report.error_count > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-bold">{report.error_count}</span>
                  <span className="text-sm">с ошибками</span>
                </div>
              )}
            </div>
            {report.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2">Ошибки:</p>
                <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {report.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-400 bg-red-500/5 rounded px-2 py-1">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvUploadTab;
