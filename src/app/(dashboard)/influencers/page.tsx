'use client';

import { InfluencerForm } from '@/components/influencer-form'; // Import the new component
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { useQuery } from '@/convex/_generated/react';

const InfluencersPage = () => {
  const influencers = useQuery(api.influencers.getInfluencers);

  if (influencers === undefined) {
    return (
      <div className='p-4 space-y-4'>
        <Skeleton className='h-10 w-1/2' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-6 w-1/3' />
        <div className='space-y-2'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>Influencers</h1>
      <InfluencerForm /> {/* Use the new InfluencerForm component */}
      <h2 className='text-xl font-semibold mb-4'>Your Influencers</h2>
      {influencers.length === 0 ? (
        <p>No influencers added yet.</p>
      ) : (
        <ul className='space-y-2'>
          {influencers.map((influencer) => (
            <li key={influencer._id} className='p-3 border rounded-md shadow-sm'>
              <p className='font-medium'>
                {influencer.name} ({influencer.platform})
              </p>
              <p className='text-sm text-gray-600'>@{influencer.handle}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InfluencersPage;
