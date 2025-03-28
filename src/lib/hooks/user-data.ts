import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export function useUserData() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  return {
    user: data,
    isLoading,
    isError: error
  };
}
