'use client';

import { useEffect } from 'react';

export default function PurchaseFlag() {
  useEffect(() => {
    localStorage.setItem('mandala_purchased', 'true');
  }, []);

  return null;
}
