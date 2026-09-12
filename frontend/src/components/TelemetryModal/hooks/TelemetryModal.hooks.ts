import { api } from '@/api/client';
import { API_URL } from '@/VARS';
import { useState, useEffect, useMemo } from 'react';
import { API_ENDPOINTS } from '../constants/TelemetryModal.constants';
import {
  SimStatus,
  ResultsResponse,
  ImagesByTabType,
  TabCategories,
} from '../types/TelemetryModalTypes';
import {
  categorizeImage,
  formatImageName,
} from '../utils/TelemetryModal.utils';

export const useSimulationResults = (open: boolean) => {
  const [images, setImages] = useState<Record<string, { default: string }>>({});
  const [loading, setLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const { signal } = controller;

    const fetchResults = async () => {
      setLoading(true);
      setImages({});
      setIsEmpty(true);
      setError(null);

      try {
        const status = await api
          .get(API_ENDPOINTS.STATUS, { signal })
          .json<SimStatus>();
        if (signal.aborted) return;

        if (!status.run_id || status.status !== 'finished') {
          setImages({});
          setIsEmpty(true);
          return;
        }

        const data = await api
          .get(API_ENDPOINTS.RESULTS(status.run_id), { signal })
          .json<ResultsResponse>();
        if (signal.aborted) return;

        const imageMap: Record<string, { default: string }> = {};
        for (const entry of data.files) {
          if (!/\.png$/i.test(entry.filename)) continue;
          const url = `${API_URL}${entry.url.replace(/^\//, '')}`;
          imageMap[entry.filename] = { default: url };
        }

        setImages(imageMap);
        setIsEmpty(Object.keys(imageMap).length === 0);
      } catch (error) {
        if (signal.aborted) return;
        console.error('Failed to fetch results:', error);
        setImages({});
        setIsEmpty(true);
        setError(
          'Could not load simulation results. Please reopen Results to try again.'
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [open]);

  return { images, loading, isEmpty, error };
};

export const useGroupedImages = (
  images: Record<string, { default: string }>
) => {
  return useMemo(() => {
    const grouped: ImagesByTabType = {
      routes: [],
      telemetry: [],
      localization: [],
      other: [],
    };

    Object.entries(images).forEach(([filename, imageData]) => {
      const category = categorizeImage(filename);
      const displayName = formatImageName(filename);

      grouped[category].push({
        url: imageData.default,
        name: displayName,
      });
    });

    for (const key of Object.keys(grouped) as TabCategories[]) {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, [images]);
};
