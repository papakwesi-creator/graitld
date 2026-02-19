'use client';

import { Alert01Icon, Link01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export default function ChannelLookupPage() {
  const [query, setQuery] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasAttempted(true);
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <div className='mb-4'>
          <h2 className='font-heading text-base font-semibold'>Channel Lookup</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            This feature is disabled until a verified live API integration is configured.
          </p>
        </div>

        <form onSubmit={handleSearch} className='flex gap-3'>
          <InputGroup className='flex-1 bg-background'>
            <InputGroupAddon align='inline-start'>
              <HugeiconsIcon icon={Search01Icon} size={16} className='text-muted-foreground' />
            </InputGroupAddon>
            <InputGroupInput
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Enter channel handle or URL'
            />
          </InputGroup>
          <Button type='submit' disabled={!query.trim()} className='gap-2' variant='outline'>
            <HugeiconsIcon icon={Link01Icon} size={16} />
            Check
          </Button>
        </form>
      </div>

      {(hasAttempted || query.trim()) && (
        <div className='rounded-xl border border-warning/30 bg-warning/5 p-6'>
          <div className='mb-3 flex items-center gap-2'>
            <HugeiconsIcon icon={Alert01Icon} size={18} className='text-warning' />
            <Badge className='bg-warning/15 text-warning'>Unavailable</Badge>
          </div>
          <p className='text-sm text-warning-foreground'>
            Live channel lookup is not connected yet. No mocked or estimated channel data is shown.
          </p>
        </div>
      )}
    </div>
  );
}
