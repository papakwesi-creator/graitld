'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useMutation } from '@/convex/_generated/react';

interface InfluencerFormProps {
  onInfluencerCreated?: () => void;
}

export const InfluencerForm: React.FC<InfluencerFormProps> = ({ onInfluencerCreated }) => {
  const createInfluencer = useMutation(api.influencers.createInfluencer);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [handle, setHandle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !platform || !handle) {
      alert('Please fill in all required fields (Name, Platform, Handle).');
      return;
    }
    setIsCreating(true);
    try {
      await createInfluencer({ name, platform, handle });
      setName('');
      setPlatform('');
      setHandle('');
      onInfluencerCreated?.();
    } catch (error) {
      console.error('Failed to create influencer:', error);
      alert('Failed to create influencer. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='mb-8 space-y-4'>
      <h2 className='text-xl font-semibold'>Add New Influencer</h2>
      <div>
        <Input
          placeholder='Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='mb-2'
          disabled={isCreating}
        />
        <Input
          placeholder='Platform (e.g., YouTube)'
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className='mb-2'
          disabled={isCreating}
        />
        <Input
          placeholder='Handle (e.g., @influencer_name)'
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className='mb-2'
          disabled={isCreating}
        />
        <Button type='submit' disabled={isCreating}>
          {isCreating ? 'Adding...' : 'Add Influencer'}
        </Button>
      </div>
    </form>
  );
};
