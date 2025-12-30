import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

// Configuration from Vite environment variables (with defaults matching config/services.php)
export const JPYC_CONTRACT_ADDRESS =
    import.meta.env.VITE_JPYC_CONTRACT_ADDRESS ||
    '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c';
export const POLYGON_CHAIN_ID = parseInt(
    import.meta.env.VITE_POLYGON_CHAIN_ID || '137',
    10,
);
export const POLYGON_CHAIN_ID_HEX = '0x' + POLYGON_CHAIN_ID.toString(16);
export const TIP_AMOUNT = import.meta.env.VITE_TIP_AMOUNT || '100';

// ERC20 ABI (transfer function only)
const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
];

export type TipError =
    | 'NO_METAMASK'
    | 'WRONG_NETWORK'
    | 'INSUFFICIENT_JPYC'
    | 'INSUFFICIENT_GAS'
    | 'USER_REJECTED'
    | 'RATE_LIMIT'
    | 'UNKNOWN';

export interface TipResult {
    success: boolean;
    txHash?: string;
    error?: TipError;
    errorMessage?: string;
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}

/**
 * Get MetaMask download URL
 */
export function getMetaMaskDownloadUrl(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
        return 'https://play.google.com/store/apps/details?id=io.metamask';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
        return 'https://apps.apple.com/app/metamask/id1438144202';
    }
    return 'https://metamask.io/download/';
}

/**
 * Switch to Polygon network
 */
export async function switchToPolygon(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
        });
        return true;
    } catch (switchError: unknown) {
        const error = switchError as { code?: number };
        // Chain not added to MetaMask
        if (error.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: POLYGON_CHAIN_ID_HEX,
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: {
                                name: 'MATIC',
                                symbol: 'MATIC',
                                decimals: 18,
                            },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/'],
                        },
                    ],
                });
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }
}

/**
 * Get JPYC balance
 */
export async function getJpycBalance(
    provider: BrowserProvider,
    address: string,
): Promise<string> {
    const jpycContract = new Contract(
        JPYC_CONTRACT_ADDRESS,
        ERC20_ABI,
        provider,
    );
    const balance = await jpycContract.balanceOf(address);
    return formatUnits(balance, 18);
}

/**
 * Send JPYC tip
 */
export async function sendJpycTip(toAddress: string): Promise<TipResult> {
    // Check MetaMask
    if (!isMetaMaskInstalled()) {
        return {
            success: false,
            error: 'NO_METAMASK',
            errorMessage: 'MetaMaskをインストールしてください',
        };
    }

    try {
        let provider = new BrowserProvider(window.ethereum!);

        // Request account access
        await provider.send('eth_requestAccounts', []);

        // Check network and switch if necessary
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
            const switched = await switchToPolygon();
            if (!switched) {
                return {
                    success: false,
                    error: 'WRONG_NETWORK',
                    errorMessage: 'ポリゴンネットワークに切り替えてください',
                };
            }
            // Re-create provider and signer after network switch
            provider = new BrowserProvider(window.ethereum!);
            await provider.send('eth_requestAccounts', []);
        }

        // Get signer after network is confirmed
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        // Check JPYC balance
        const balance = await getJpycBalance(provider, userAddress);
        if (parseFloat(balance) < parseFloat(TIP_AMOUNT)) {
            return {
                success: false,
                error: 'INSUFFICIENT_JPYC',
                errorMessage: `JPYC残高が不足しています（現在: ${Math.floor(parseFloat(balance))} JPYC、必要: ${TIP_AMOUNT} JPYC）`,
            };
        }

        // Create contract instance with signer
        const jpycContract = new Contract(
            JPYC_CONTRACT_ADDRESS,
            ERC20_ABI,
            signer,
        );

        // Send transfer
        const amount = parseUnits(TIP_AMOUNT, 18);
        const tx = await jpycContract.transfer(toAddress, amount);

        // Wait for confirmation
        await tx.wait();

        return {
            success: true,
            txHash: tx.hash,
        };
    } catch (err: unknown) {
        const error = err as { code?: number | string; message?: string };

        // User rejected transaction
        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            return {
                success: false,
                error: 'USER_REJECTED',
                errorMessage: 'トランザクションをキャンセルしました',
            };
        }

        // Insufficient funds for gas
        if (
            error.code === 'INSUFFICIENT_FUNDS' ||
            error.message?.includes('insufficient funds')
        ) {
            return {
                success: false,
                error: 'INSUFFICIENT_GAS',
                errorMessage: 'MATIC残高が不足しています（ガス代が必要です）',
            };
        }

        console.error('Tip error:', error);
        return {
            success: false,
            error: 'UNKNOWN',
            errorMessage: '送金に失敗しました。時間をおいて再度お試しください',
        };
    }
}

/**
 * Get Polygonscan transaction URL
 */
export function getPolygonscanUrl(txHash: string): string {
    return `https://polygonscan.com/tx/${txHash}`;
}
