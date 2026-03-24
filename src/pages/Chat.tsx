import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Chat } from './Chat';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createMockStore } from 'redux-mock-store';
import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/types/chat';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
      signOut: jest.fn(),
    },
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockResolvedValue([]),
      eq: jest.fn().mockReturnValue({}),
      insert: jest.fn().mockResolvedValue({ data: [] }),
      update: jest.fn().mockResolvedValue({ data: [] }),
    })),
  },
}));

describe('Chat Component', () => {
  test('should render chat interface', () => {
    render(<Chat />);
    expect(screen.getByText(/LoadSaathi/)).toBeInTheDocument();
  });

  test('should handle sending messages', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <Chat />
    );
    const input = getByPlaceholderText('Type a message...');
    const sendButton = getByText(/Send/);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
    expect(sendButton).toBeDisabled();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('should handle typing indicator', async () => {
    const { getByTestId } = render(<Chat />);
    fireEvent.input(getByTestId('typing-input'), { target: { value: 'He' } });
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    fireEvent.input(getByTestId('typing-input'), { target: { value: '' } });
  });

  test('should handle error states', async () => {
    const { getByText, getByTestId } = render();
    const errorButton = getByText(/Send/);
    fireEvent.click(errorButton);
    expect(getByTestId('error-message')).toBeInTheDocument();
  });
});