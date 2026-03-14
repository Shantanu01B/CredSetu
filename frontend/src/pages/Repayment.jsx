import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Repayment = () => {
    const [amount, setAmount] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpId, setOtpId] = useState(null);
    const [mockOtp, setMockOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!amount) return toast.error("Enter amount first");
        setLoading(true);
        try {
            const { data } = await api.post('/otp/send');
            toast.success("OTP Sent!");
            setShowOtpInput(true);
            setMockOtp(data.otp);
        } catch {
            toast.error("Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/otp/verify', { otp });
            if (data.verified) {
                setOtpVerified(true);
                setOtpId(data.otpId);
                toast.success("OTP Verified!");
            }
        } catch {
            toast.error("Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!otpVerified || !otpId) return toast.error("Please verify OTP first");

        const res = await loadRazorpay();
        if (!res) return toast.error('Razorpay SDK failed to load');

        try {
            const { data: order } = await api.post('/payment/create-order', { amount: Number(amount) });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "CredSetu SHG",
                description: "Loan Repayment",
                order_id: order.id,
                handler: async (response) => {
                    try {
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: Number(amount),
                            otpId
                        });
                        toast.success("Payment successful!");
                        navigate('/dashboard');
                    } catch {
                        toast.error("Payment verification failed");
                    }
                },
                prefill: { name: user.name, email: user.email, contact: "9999999999" },
                theme: { color: "#0f172a" },
            };

            new window.Razorpay(options).open();
        } catch {
            toast.error("Payment failed");
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Loan Repayment</h2>

                {!otpVerified ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Repayment Amount (₹)</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={showOtpInput}
                            />
                        </div>

                        {!showOtpInput ? (
                            <button onClick={handleSendOTP} disabled={loading} className="w-full bg-slate-800 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors mt-2 disabled:opacity-50">
                                {loading ? 'Sending...' : 'Send OTP to Verify'}
                            </button>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">Enter 6-digit OTP</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    className="w-full text-center tracking-widest text-lg font-bold px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                                <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6} className="w-full mt-4 bg-slate-800 text-white py-2.5 rounded-md font-medium hover:bg-slate-700 transition-colors disabled:opacity-50">
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                {mockOtp && (
                                    <p className="text-xs text-center text-gray-400 mt-2">
                                        Demo OTP: <span className="font-bold text-gray-600">{mockOtp}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-green-50 text-green-700 p-4 rounded border border-green-200">
                            <p className="font-bold">Verification Successful</p>
                            <p className="text-sm mt-1">Ready to repay ₹{amount}</p>
                        </div>
                        <button onClick={handlePayment} className="w-full bg-slate-800 text-white py-3 rounded-md font-bold hover:bg-slate-700 transition-colors">
                            Pay Securely
                        </button>
                        <p className="text-xs text-gray-400">Secured by Razorpay</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Repayment;
