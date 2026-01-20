import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPage } from './AdminPage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('../context/AuthContext');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        Link: (props: any) => <a href={props.to} className={props.className} onClick={(e) => {
            e.preventDefault();
            // 這裡不需真正導航，只要渲染出元素供測試即可
            // 如果需要測試點擊 Link 的導航行為，可能需要 mock navigate 或 wrapper
        }}>{props.children}</a>,
    };
});

// 由於 AdminPage 裡直接用 Link，我們需要確保 render 內容正確。
// 對於 Link 的點擊測試，如果不使用 MemoryRouter 包裹，單純 mock Link 也可以。
// 為了更貼近甚至測試 navigate 行為，可以 mock useNavigate。
// 注意 AdminPage 有個 Link 回 dashboard。

describe('AdminPage', () => {
    const mockLogout = vi.fn();
    const mockNavigate = vi.fn();

    const adminUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
    };

    const defaultAuthContext = {
        user: adminUser,
        token: 'token',
        isLoading: false,
        isAuthenticated: true,
        authExpiredMessage: null,
        login: vi.fn(),
        logout: mockLogout,
        checkAuth: vi.fn(),
        clearAuthExpiredMessage: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultAuthContext);
    });

    it('【UI】驗證 Admin 頁面內容渲染', () => {
        render(<AdminPage />);

        expect(screen.getByRole('heading', { name: /管理後台/i })).toBeInTheDocument();
        expect(screen.getByText(/← 返回/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /登出/i })).toBeInTheDocument();
        expect(screen.getByText('管理員')).toBeInTheDocument(); // Role badge
        expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
    });

    it('【Functionality】驗證返回按鈕', async () => {
        // 因為我們 mock 了 Link 渲染成 <a>，且沒有 router context，
        // 這裡主要測試 href 屬性是否正確，或者使用 userEvent 點擊看是否有反應
        // 但因為 Link 是 react-router 元件，最好是用 MemoryRouter 包或檢查屬性。
        // 上面的 mock Link 轉成了 a tag。

        render(<AdminPage />);

        const backLink = screen.getByText(/← 返回/i);
        expect(backLink).toHaveAttribute('href', '/dashboard');
    });

    it('【Functionality】驗證登出功能', async () => {
        const user = userEvent.setup();
        render(<AdminPage />);

        await user.click(screen.getByRole('button', { name: /登出/i }));

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
    });
});
