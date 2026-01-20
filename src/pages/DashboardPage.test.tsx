import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../api/productApi';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('../context/AuthContext');
vi.mock('../api/productApi');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        Link: (props: any) => <a href={props.to} className={props.className}>{props.children}</a>,
    };
});

describe('DashboardPage', () => {
    const mockLogout = vi.fn();
    const mockNavigate = vi.fn();

    const defaultUser = {
        id: '2',
        username: 'testuser',
        email: 'user@example.com',
        role: 'user',
    };

    const adminUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
    };

    const defaultAuthContext = {
        user: defaultUser,
        token: 'token',
        isLoading: false,
        isAuthenticated: true,
        authExpiredMessage: null,
        login: vi.fn(),
        logout: mockLogout,
        checkAuth: vi.fn(),
        clearAuthExpiredMessage: vi.fn(),
    };

    const mockProducts = [
        { id: 1, name: 'Product A', price: 100, description: 'Desc A' },
        { id: 2, name: 'Product B', price: 200, description: 'Desc B' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockNavigate);
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultAuthContext);
        (productApi.getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockProducts);
    });

    it('【UI】驗證 Dashboard 基本資訊渲染', async () => {
        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /儀表板/i })).toBeInTheDocument();
            expect(screen.getByText(/Welcome, testuser/i)).toBeInTheDocument();
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
            // 不顯示管理後台連結
            expect(screen.queryByText(/管理後台/i)).not.toBeInTheDocument();
        });
    });

    it('【UI】驗證 Admin 權限連結顯示', async () => {
        (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            ...defaultAuthContext,
            user: adminUser,
        });

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/管理後台/i)).toBeInTheDocument();
        });
    });

    it('【Functionality】驗證登出功能', async () => {
        const user = userEvent.setup();
        render(<DashboardPage />);

        await waitFor(() => screen.getByText(/Welcome/)); // Wait for load

        await user.click(screen.getByRole('button', { name: /登出/i }));

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
    });

    it('【Integration】驗證商品列表載入成功', async () => {
        render(<DashboardPage />);

        // 一開始顯示 loading
        expect(screen.getByText(/載入商品中/i)).toBeInTheDocument();

        // 載入後
        await waitFor(() => {
            expect(screen.getByText('Product A')).toBeInTheDocument();
            expect(screen.getByText('Product B')).toBeInTheDocument();
            expect(screen.getByText('Desc A')).toBeInTheDocument();
            // 驗證價格格式
            expect(screen.getByText(/NT\$ 100/)).toBeInTheDocument();
        });
    });

    it('【Integration】驗證商品列表載入失敗', async () => {
        const errorMessage = 'API Error Occurred';
        (productApi.getProducts as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
            response: {
                status: 500,
                data: { message: errorMessage }
            }
        });

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('【Logic】驗證 Token 過期 (401) 處理', async () => {
        (productApi.getProducts as unknown as ReturnType<typeof vi.fn>).mockRejectedValue({
            response: {
                status: 401,
            }
        });

        render(<DashboardPage />);

        // 根據程式碼邏輯，401 會直接 return 掉，finally 會設 isLoading(false)
        // 所以畫面應該是沒有 loading，但也沒顯示 error，也沒顯示商品 (products 為空)
        await waitFor(() => {
            expect(screen.queryByText(/載入商品中/i)).not.toBeInTheDocument();
        });

        // 確保沒有錯誤訊息
        expect(screen.queryByText(/無法載入商品資料/i)).not.toBeInTheDocument();

        // 商品列表應該是空的
        expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    });
});
