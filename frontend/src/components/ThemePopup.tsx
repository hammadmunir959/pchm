import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ThemePopup: React.FC = () => {
  // Theme popup disabled - using landing page popup instead (ServiceSelectionPopup)
  // This component is kept for backward compatibility but will not render
  return null;
};

export default ThemePopup;

