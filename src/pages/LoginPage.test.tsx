import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('../context/AuthContext');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('LoginPage', () => {
    const mockLogin = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();
    const mockNavigate = vi.fn();

    const defaultAuthContext = {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        authExpiredMessage: null,
        login: mockLogin,
        logout: vi.fn(),
        checkAuth: vi.fn(),
        clearAuthExpiredMessage: mockClearAuthExpiredMessage,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultAuthContext);
    });

    it('【UI】驗證登入頁面初始渲染', () => {
        render(<LoginPage />);

        expect(screen.getByRole('heading', { name: /歡迎回來/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/密碼/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();

        // 若非正式環境，顯示測試帳號提示 (假設現在是 dev 環境)
        if (!import.meta.env.VITE_API_URL) {
            expect(screen.getByText(/測試帳號：/i)).toBeInTheDocument();
        }
    });

    it('【Validation】驗證 Email 格式檢查 - 無效格式', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/電子郵件/i);
        await user.type(emailInput, 'invalid-email');
        await user.click(screen.getByRole('button', { name: '登入' })); // Trigger validation on submit

        expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
    });

    it('【Validation】驗證密碼長度檢查 - 過短', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const passwordInput = screen.getByLabelText(/密碼/i);
        await user.type(passwordInput, '1234567');
        await user.click(screen.getByRole('button', { name: '登入' }));

        expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
    });

    it('【Validation】驗證密碼複雜度檢查 - 缺少英文字母', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const passwordInput = screen.getByLabelText(/密碼/i);
        await user.type(passwordInput, '12345678');
        await user.click(screen.getByRole('button', { name: '登入' }));

        expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
    });

    it('【Validation】驗證密碼複雜度檢查 - 缺少數字', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const passwordInput = screen.getByLabelText(/密碼/i);
        await user.type(passwordInput, 'abcdefgh');
        await user.click(screen.getByRole('button', { name: '登入' }));

        expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
    });

    it('【Validation】驗證密碼複雜度檢查 - 正確格式', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        // 需同時輸入正確 Email 以避免 Email 錯誤干擾
        await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
        await user.type(screen.getByLabelText(/密碼/i), '1234567a');
        await user.click(screen.getByRole('button', { name: '登入' }));

        expect(screen.queryByText(/密碼必須/i)).not.toBeInTheDocument();
    });

    it('【Functionality】表單提交 - 驗證失敗阻擋', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByLabelText(/電子郵件/i), 'bad-email');
        await user.click(screen.getByRole('button', { name: '登入' }));

        expect(mockLogin).not.toHaveBeenCalled();
        expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
    });

    it('【Interaction】驗證載入狀態 (Loading State)', async () => {
        const user = userEvent.setup();
        // 讓 login promise 永遠不 resolve 以測試 loading 狀態 (或是延遲 resolve)
        mockLogin.mockImplementation(() => new Promise(() => { }));

        render(<LoginPage />);

        await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
        await user.type(screen.getByLabelText(/密碼/i), 'password123');
        await user.click(screen.getByRole('button', { name: '登入' }));

        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText(/登入中.../i)).toBeInTheDocument();
    });

    it('【Functionality】登入失敗處理 (API Error)', async () => {
        const user = userEvent.setup();
        const errorMessage = '帳號或密碼錯誤';
        mockLogin.mockRejectedValue({
            response: {
                data: { message: errorMessage }
            }
        });

        render(<LoginPage />);

        await user.type(screen.getByLabelText(/電子郵件/i), 'wrong@example.com');
        await user.type(screen.getByLabelText(/密碼/i), 'password123');
        await user.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('【Functionality】登入成功處理', async () => {
        const user = userEvent.setup();
        mockLogin.mockResolvedValue(undefined);

        render(<LoginPage />);

        await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
        await user.type(screen.getByLabelText(/密碼/i), 'password123');
        await user.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });
    });

    it('【Logic】驗證已登入狀態導向', () => {
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            ...defaultAuthContext,
            isAuthenticated: true,
        });

        render(<LoginPage />);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('【Logic】驗證 Auth Expired 訊息顯示', () => {
        const expiredMsg = '登入已過期，請重新登入';
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            ...defaultAuthContext,
            authExpiredMessage: expiredMsg,
        });

        render(<LoginPage />);

        expect(screen.getByText(expiredMsg)).toBeInTheDocument();
        expect(mockClearAuthExpiredMessage).toHaveBeenCalled();
    });
});
