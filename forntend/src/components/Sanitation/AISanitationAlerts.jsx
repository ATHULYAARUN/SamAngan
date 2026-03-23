import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Loader2, RefreshCw, Info } from 'lucide-react';
import sanitationService from '../../services/sanitationService';

const levelStyles = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

const AISanitationAlerts = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const res = await sanitationService.getAiPredictions();
      setPredictions(res?.predictions || []);
    } catch (err) {
      console.error(err);
      setPredictions([{ type: 'info', level: 'low', message: 'Unable to load predictions. Please try again.', location: '' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI Sanitation Alerts</h2>
        <button
          onClick={loadPredictions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <p className="text-gray-600 text-sm">
        Risk predictions are generated from waste accumulation, drainage blockage history, open issues, and collection delays in Ward 9.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((p, i) => (
            <motion.div
              key={`${p.type}-${i}-${p.location}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-4 ${levelStyles[p.level] || levelStyles.info}`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {p.level === 'high' ? (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  ) : p.level === 'medium' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Info className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{p.message}</p>
                  {p.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm opacity-90">
                      <MapPin className="w-4 h-4" />
                      {p.location}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISanitationAlerts;
