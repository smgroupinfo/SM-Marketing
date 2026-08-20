import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");const React = !__vite__cjsImport0_react.__esModule ? __vite__cjsImport0_react : __vite__cjsImport0_react.default; const useState = __vite__cjsImport0_react["useState"]; const useEffect = __vite__cjsImport0_react["useEffect"];const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=eb88d9df";
import axios from "/node_modules/.vite/deps/axios.js?v=eb88d9df";
import { LogOut, Navigation, Play, Square, FileText, CheckCircle, History, Search, TrendingUp, IndianRupee, User, Store, MapPin, Calendar, Settings, Users, Activity, BarChart, Settings2 } from "/node_modules/.vite/deps/lucide-react.js?v=eb88d9df";
var _jsxFileName = "/app/applet/src/App.jsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=eb88d9df";
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$(), _s5 = $RefreshSig$();
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers["Authorization"] = `Bearer ${token}`;
	}
	return config;
});
export default function App() {
	_s();
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem("token") || "");
	const [currentPage, setCurrentPage] = useState("dashboard");
	const [locationError, setLocationError] = useState(false);
	const [isBypassed, setIsBypassed] = useState(false);
	useEffect(() => {
		if (token) {
			const storedUser = localStorage.getItem("user");
			if (storedUser) setUser(JSON.parse(storedUser));
		}
	}, [token]);
	useEffect(() => {
		if (!token) return;
		let watchId;
		if ("geolocation" in navigator) {
			watchId = navigator.geolocation.watchPosition((position) => setLocationError(false), (error) => {
				console.error("Geolocation error:", error.message || error);
				setLocationError(true);
			}, {
				enableHighAccuracy: true,
				maximumAge: 1e4,
				timeout: 5e3
			});
		} else {
			setLocationError(true);
		}
		return () => {
			if (watchId !== undefined) {
				navigator.geolocation.clearWatch(watchId);
			}
		};
	}, [token]);
	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setToken("");
		setUser(null);
	};
	if (!token) {
		return /* @__PURE__ */ _jsxDEV(Login, { onLogin: (t, u) => {
			setToken(t);
			setUser(u);
		} }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 63,
			columnNumber: 12
		}, this);
	}
	if (!user) {
		return /* @__PURE__ */ _jsxDEV("div", {
			className: "min-h-screen bg-gray-50 flex items-center justify-center text-gray-500",
			children: "Loading..."
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 70,
			columnNumber: 12
		}, this);
	}
	if (locationError && !isBypassed) {
		return /* @__PURE__ */ _jsxDEV("div", {
			className: "min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center z-50",
			children: /* @__PURE__ */ _jsxDEV("div", {
				className: "bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6",
						children: /* @__PURE__ */ _jsxDEV(Navigation, { size: 32 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 78,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 77,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("h2", {
						className: "text-xl font-bold text-gray-900 mb-2",
						children: "GPS Required"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 80,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "text-gray-600 mb-6 text-sm",
						children: "Please enable location services and grant GPS permissions to use the Field Executive portal."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 81,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => window.location.reload(),
						className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-3",
						children: "Check Again"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 84,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setIsBypassed(true),
						className: "w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors",
						children: "Bypass for Testing"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 90,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 76,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 75,
			columnNumber: 7
		}, this);
	}
	const isAdmin = user && user.role === "ADMIN";
	const renderPage = () => {
		if (isAdmin) {
			switch (currentPage) {
				case "admin-dashboard": return /* @__PURE__ */ _jsxDEV(AdminDashboard, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 106,
					columnNumber: 40
				}, this);
				case "admin-config": return /* @__PURE__ */ _jsxDEV(AdminConfig, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 107,
					columnNumber: 37
				}, this);
				case "admin-ums": return /* @__PURE__ */ _jsxDEV(AdminUMS, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 108,
					columnNumber: 34
				}, this);
				case "profile": return /* @__PURE__ */ _jsxDEV(ProfileSettings, {
					user,
					onLogout: handleLogout
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 109,
					columnNumber: 32
				}, this);
				default: return /* @__PURE__ */ _jsxDEV(AdminDashboard, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 110,
					columnNumber: 25
				}, this);
			}
		} else {
			switch (currentPage) {
				case "dashboard": return /* @__PURE__ */ _jsxDEV(ShiftDashboard, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 114,
					columnNumber: 34
				}, this);
				case "visits": return /* @__PURE__ */ _jsxDEV(VisitLogger, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 115,
					columnNumber: 31
				}, this);
				case "history": return /* @__PURE__ */ _jsxDEV(VisitHistory, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 116,
					columnNumber: 32
				}, this);
				case "incentives": return /* @__PURE__ */ _jsxDEV(IncentivesDashboard, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 117,
					columnNumber: 35
				}, this);
				case "onboard": return /* @__PURE__ */ _jsxDEV(FirmOnboarding, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 118,
					columnNumber: 32
				}, this);
				case "profile": return /* @__PURE__ */ _jsxDEV(ProfileSettings, {
					user,
					onLogout: handleLogout
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 119,
					columnNumber: 32
				}, this);
				default: return /* @__PURE__ */ _jsxDEV(ShiftDashboard, { user }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 120,
					columnNumber: 25
				}, this);
			}
		}
	};
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20",
		children: [
			/* @__PURE__ */ _jsxDEV("header", {
				className: "bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm",
				children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", {
					className: "text-xl font-black text-gray-900 tracking-tight leading-none",
					children: isAdmin ? "ADMIN CONTROL" : "SMM PORTAL"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 129,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", {
					className: "text-xs text-gray-500 font-medium mt-1",
					children: isAdmin ? "Sundaram Mahadeo Group" : `${user.full_name} • Field Exec`
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 132,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 128,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("button", {
					onClick: handleLogout,
					className: "p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors",
					title: "Logout",
					children: /* @__PURE__ */ _jsxDEV(LogOut, { size: 20 }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 141,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 136,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 127,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("main", {
				className: "flex-1 p-6 max-w-4xl mx-auto w-full",
				children: renderPage()
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 145,
				columnNumber: 7
			}, this),
			isAdmin ? /* @__PURE__ */ _jsxDEV("nav", {
				className: "fixed bottom-0 w-full max-w-4xl mx-auto bg-white border-t border-gray-200 grid grid-cols-4 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]",
				children: [
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("admin-dashboard"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "admin-dashboard" || currentPage === "dashboard" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(Activity, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 155,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Dashboard"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 156,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 151,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("admin-config"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "admin-config" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(Settings2, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 162,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Config"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 163,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 158,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("admin-ums"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "admin-ums" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(Users, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 169,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "UMS"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 170,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 165,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("profile"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "profile" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(User, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 176,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Profile"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 177,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 172,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 150,
				columnNumber: 9
			}, this) : /* @__PURE__ */ _jsxDEV("nav", {
				className: "fixed bottom-0 w-full max-w-4xl mx-auto bg-white border-t border-gray-200 grid grid-cols-6 p-2 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]",
				children: [
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("dashboard"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "dashboard" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(Navigation, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 186,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Shift"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 187,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 182,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("visits"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "visits" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(CheckCircle, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 193,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Log Visit"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 194,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 189,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("history"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "history" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(History, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 200,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "History"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 201,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 196,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("onboard"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "onboard" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(Store, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 207,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Onboard"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 208,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 203,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("incentives"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "incentives" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(TrendingUp, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 214,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "P & I"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 215,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 210,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: () => setCurrentPage("profile"),
						className: `flex flex-col items-center justify-center space-y-1 ${currentPage === "profile" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`,
						children: [/* @__PURE__ */ _jsxDEV(User, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 221,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							className: "text-[10px] font-medium truncate w-full text-center",
							children: "Profile"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 222,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 217,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 181,
				columnNumber: 9
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 126,
		columnNumber: 5
	}, this);
}
_s(App, "slxPZnzWMOlLzeCHfh9TV1dNytc=");
_c = App;
function Login({ onLogin }) {
	_s2();
	const [isRegistering, setIsRegistering] = useState(false);
	const [fullName, setFullName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [emailOrPhone, setEmailOrPhone] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			if (isRegistering) {
				await api.post("/auth/register", {
					fullName,
					phoneNumber,
					email: emailOrPhone,
					password,
					role: "EXECUTIVE"
				});
			}
			const loginRes = await api.post("/auth/login", {
				emailOrPhone,
				password
			});
			localStorage.setItem("token", loginRes.data.token);
			localStorage.setItem("user", JSON.stringify(loginRes.data.user));
			onLogin(loginRes.data.token, loginRes.data.user);
		} catch (err) {
			setError(err.response?.data?.error || "Authentication failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "min-h-screen bg-gray-100 flex items-center justify-center p-4",
		children: /* @__PURE__ */ _jsxDEV("div", {
			className: "bg-white p-8 rounded-2xl shadow-xl w-full max-w-md",
			children: [
				/* @__PURE__ */ _jsxDEV("div", {
					className: "flex justify-center mb-6",
					children: /* @__PURE__ */ _jsxDEV("div", {
						className: "h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg",
						children: /* @__PURE__ */ _jsxDEV(Navigation, { className: "text-white w-8 h-8" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 270,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 269,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 268,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("h2", {
					className: "text-2xl font-bold text-center text-gray-900 mb-8",
					children: isRegistering ? "Create Executive Account" : "SMM Executive Login"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 273,
					columnNumber: 9
				}, this),
				error && /* @__PURE__ */ _jsxDEV("div", {
					className: "bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm",
					children: error
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 276,
					columnNumber: 19
				}, this),
				/* @__PURE__ */ _jsxDEV("form", {
					onSubmit: handleSubmit,
					className: "space-y-4",
					children: [
						isRegistering && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: "Full Name"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 280,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "text",
							value: fullName,
							onChange: (e) => setFullName(e.target.value),
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
							required: isRegistering
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 281,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 279,
							columnNumber: 13
						}, this),
						isRegistering && /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: "Phone Number"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 292,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "text",
							value: phoneNumber,
							onChange: (e) => setPhoneNumber(e.target.value),
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
							required: isRegistering
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 293,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 291,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: isRegistering ? "Email Address" : "Email or Phone"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 303,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "text",
							value: emailOrPhone,
							onChange: (e) => setEmailOrPhone(e.target.value),
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
							required: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 306,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 302,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: "Password"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 315,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
							required: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 316,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 314,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("button", {
							type: "submit",
							disabled: loading,
							className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-70 mt-4",
							children: loading ? "Processing..." : isRegistering ? "Register & Login" : "Start Session"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 324,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 277,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "mt-6 text-center",
					children: /* @__PURE__ */ _jsxDEV("button", {
						type: "button",
						onClick: () => setIsRegistering(!isRegistering),
						className: "text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors",
						children: isRegistering ? "Already have an account? Login" : "Need an account? Register"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 333,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 332,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 267,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 266,
		columnNumber: 5
	}, this);
}
_s2(Login, "TP6fqgu5ndNA8d384/wDWA8NHc4=");
_c2 = Login;
function AdminUMS({ user }) {
	_s3();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("PENDING");
	const [editUser, setEditUser] = useState(null);
	const [editForm, setEditForm] = useState({
		role: "EXECUTIVE",
		supervisor: "",
		status: "ACTIVE"
	});
	const [message, setMessage] = useState("");
	useEffect(() => {
		fetchUsers();
	}, []);
	const fetchUsers = async () => {
		setLoading(true);
		try {
			const res = await api.get("/admin/users");
			// For mock users created via app, status might be undefined if created before our patch. Fix that on client side.
			const normalizedUsers = res.data.users.map((u) => ({
				...u,
				status: u.status || (u.role === "ADMIN" ? "ACTIVE" : "PENDING")
			}));
			setUsers(normalizedUsers);
		} catch (err) {
			console.error("Failed to fetch users", err);
		} finally {
			setLoading(false);
		}
	};
	const handleApprove = async (e) => {
		e.preventDefault();
		setMessage("");
		try {
			await api.put(`/admin/users/${editUser.user_id}/approve`, editForm);
			setMessage("User updated successfully.");
			setEditUser(null);
			fetchUsers();
			setTimeout(() => setMessage(""), 3e3);
		} catch (err) {
			setMessage("Failed to update user.");
		}
	};
	const filteredUsers = users.filter((u) => u.status === statusFilter);
	if (loading) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-8 text-center text-gray-500",
		children: "Loading users..."
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 390,
		columnNumber: 23
	}, this);
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "flex p-1 bg-white border border-gray-200 rounded-xl max-w-sm shadow-sm",
				children: [
					"PENDING",
					"ACTIVE",
					"DISABLED"
				].map((status) => /* @__PURE__ */ _jsxDEV("button", {
					onClick: () => setStatusFilter(status),
					className: `flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${statusFilter === status ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"}`,
					children: status
				}, status, false, {
					fileName: _jsxFileName,
					lineNumber: 396,
					columnNumber: 11
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 394,
				columnNumber: 7
			}, this),
			message && /* @__PURE__ */ _jsxDEV("div", {
				className: `p-4 rounded-xl text-sm font-medium ${message.includes("Failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`,
				children: message
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 407,
				columnNumber: 9
			}, this),
			editUser && /* @__PURE__ */ _jsxDEV("div", {
				className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in zoom-in-95",
				children: [/* @__PURE__ */ _jsxDEV("h3", {
					className: "text-lg font-bold text-gray-900 mb-4",
					children: ["Edit User: ", editUser.full_name]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 414,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("form", {
					onSubmit: handleApprove,
					className: "space-y-4 max-w-sm",
					children: [
						/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: "Status"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 417,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("select", {
							value: editForm.status,
							onChange: (e) => setEditForm({
								...editForm,
								status: e.target.value
							}),
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg",
							children: [
								/* @__PURE__ */ _jsxDEV("option", {
									value: "PENDING",
									children: "Pending Approval"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 419,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("option", {
									value: "ACTIVE",
									children: "Active"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 420,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("option", {
									value: "DISABLED",
									children: "Disabled"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 421,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 418,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 416,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: "Duty / Role"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 425,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("select", {
							value: editForm.role,
							onChange: (e) => setEditForm({
								...editForm,
								role: e.target.value
							}),
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg",
							children: [
								/* @__PURE__ */ _jsxDEV("option", {
									value: "EXECUTIVE",
									children: "Field Executive"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 427,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("option", {
									value: "MANAGER",
									children: "Manager"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 428,
									columnNumber: 17
								}, this),
								/* @__PURE__ */ _jsxDEV("option", {
									value: "ADMIN",
									children: "Admin"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 429,
									columnNumber: 17
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 426,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 424,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
							className: "block text-sm font-medium text-gray-700 mb-1",
							children: "Assign Supervisor"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 433,
							columnNumber: 15
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "text",
							value: editForm.supervisor,
							onChange: (e) => setEditForm({
								...editForm,
								supervisor: e.target.value
							}),
							placeholder: "e.g. Ramesh Kumar",
							className: "w-full px-4 py-2 border border-gray-300 rounded-lg",
							required: true
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 434,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 432,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "flex gap-3 pt-2",
							children: [/* @__PURE__ */ _jsxDEV("button", {
								type: "submit",
								className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg",
								children: "Save Changes"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 437,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("button", {
								type: "button",
								onClick: () => setEditUser(null),
								className: "flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg",
								children: "Cancel"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 438,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 436,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 415,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 413,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",
				children: /* @__PURE__ */ _jsxDEV("table", {
					className: "w-full text-left text-sm",
					children: [/* @__PURE__ */ _jsxDEV("thead", {
						className: "bg-gray-50 border-b border-gray-100",
						children: /* @__PURE__ */ _jsxDEV("tr", {
							className: "text-gray-500",
							children: [
								/* @__PURE__ */ _jsxDEV("th", {
									className: "p-4 font-medium",
									children: "Name / Contact"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 448,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("th", {
									className: "p-4 font-medium",
									children: "Role / Supervisor"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 449,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("th", {
									className: "p-4 font-medium",
									children: "Action"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 450,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 447,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 446,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("tbody", { children: [filteredUsers.map((u) => /* @__PURE__ */ _jsxDEV("tr", {
						className: "border-b border-gray-50 hover:bg-gray-50",
						children: [
							/* @__PURE__ */ _jsxDEV("td", {
								className: "p-4",
								children: [/* @__PURE__ */ _jsxDEV("p", {
									className: "font-semibold text-gray-900",
									children: u.full_name
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 457,
									columnNumber: 19
								}, this), /* @__PURE__ */ _jsxDEV("p", {
									className: "text-xs text-gray-500",
									children: u.phone_number
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 458,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 456,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ _jsxDEV("td", {
								className: "p-4",
								children: [/* @__PURE__ */ _jsxDEV("p", {
									className: "font-medium text-gray-800",
									children: u.role
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 461,
									columnNumber: 19
								}, this), /* @__PURE__ */ _jsxDEV("p", {
									className: "text-xs text-gray-500",
									children: u.supervisor || "Unassigned"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 462,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 460,
								columnNumber: 17
							}, this),
							/* @__PURE__ */ _jsxDEV("td", {
								className: "p-4",
								children: /* @__PURE__ */ _jsxDEV("button", {
									onClick: () => {
										setEditUser(u);
										setEditForm({
											role: u.role,
											supervisor: u.supervisor || "",
											status: u.status
										});
									},
									className: "text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors",
									children: u.status === "PENDING" ? "Approve User" : "Manage"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 465,
									columnNumber: 19
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 464,
								columnNumber: 17
							}, this)
						]
					}, u.user_id, true, {
						fileName: _jsxFileName,
						lineNumber: 455,
						columnNumber: 15
					}, this)), filteredUsers.length === 0 && /* @__PURE__ */ _jsxDEV("tr", { children: /* @__PURE__ */ _jsxDEV("td", {
						colSpan: "3",
						className: "p-8 text-center text-gray-500",
						children: "No users found in this status."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 479,
						columnNumber: 17
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 478,
						columnNumber: 15
					}, this)] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 453,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 445,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 444,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 393,
		columnNumber: 5
	}, this);
}
_s3(AdminUMS, "mKnUocZ2a9EK2hGqKM4xCWpRTXc=");
_c3 = AdminUMS;
function AdminConfig({ user }) {
	_s4();
	const [config, setConfig] = useState({
		kmRate: "",
		foodingAllowance: "",
		incentives: []
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	// New Product State
	const [newProduct, setNewProduct] = useState({
		name: "",
		unit: "Bags",
		rate: ""
	});
	useEffect(() => {
		fetchConfig();
	}, []);
	const fetchConfig = async () => {
		try {
			const res = await api.get("/admin/config");
			// Normalize in case backend still has old dict format (mock fallback)
			let parsedConfig = res.data;
			if (!Array.isArray(parsedConfig.incentives)) {
				parsedConfig.incentives = Object.entries(parsedConfig.incentives || {}).map(([name, rate], idx) => ({
					id: String(idx + 1),
					name,
					unit: "Units",
					rate
				}));
			}
			setConfig(parsedConfig);
		} catch (err) {
			console.error("Failed to fetch admin config", err);
		} finally {
			setLoading(false);
		}
	};
	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setMessage("");
		try {
			const res = await api.put("/admin/config", config);
			setConfig(res.data.config);
			setMessage("Configuration saved successfully. Globally applied.");
			setTimeout(() => setMessage(""), 3e3);
		} catch (err) {
			setMessage("Error saving configuration.");
		} finally {
			setSaving(false);
		}
	};
	const addProduct = () => {
		if (!newProduct.name || !newProduct.rate) return;
		setConfig((prev) => ({
			...prev,
			incentives: [...prev.incentives, {
				...newProduct,
				id: Date.now().toString(),
				rate: parseFloat(newProduct.rate)
			}]
		}));
		setNewProduct({
			name: "",
			unit: "Bags",
			rate: ""
		});
	};
	const removeProduct = (id) => {
		setConfig((prev) => ({
			...prev,
			incentives: prev.incentives.filter((p) => p.id !== id)
		}));
	};
	if (loading) return /* @__PURE__ */ _jsxDEV("div", {
		className: "py-8 text-center text-gray-500",
		children: "Loading configurations..."
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 552,
		columnNumber: 23
	}, this);
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-6",
		children: /* @__PURE__ */ _jsxDEV("div", {
			className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100",
			children: [
				/* @__PURE__ */ _jsxDEV("h3", {
					className: "text-lg font-bold text-gray-900 mb-2",
					children: "Rate & Allowance Configurations"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 557,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("p", {
					className: "text-sm text-gray-500 mb-6",
					children: "Values updated here instantly reflect across all executive devices for P & I math."
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 558,
					columnNumber: 9
				}, this),
				message && /* @__PURE__ */ _jsxDEV("div", {
					className: `p-4 rounded-xl mb-6 text-sm font-medium ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`,
					children: message
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 561,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV("form", {
					onSubmit: handleSave,
					className: "space-y-6",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 max-w-lg",
							children: [
								/* @__PURE__ */ _jsxDEV("h4", {
									className: "font-semibold text-gray-800 border-b border-gray-200 pb-2",
									children: "Reimbursement Settings"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 568,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
									className: "block text-sm font-medium text-gray-700 mb-1",
									children: "Per-KM Reimbursement Rate (₹)"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 570,
									columnNumber: 15
								}, this), /* @__PURE__ */ _jsxDEV("input", {
									type: "number",
									step: "0.1",
									value: config.kmRate,
									onChange: (e) => setConfig({
										...config,
										kmRate: parseFloat(e.target.value) || 0
									}),
									className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500",
									required: true
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 571,
									columnNumber: 15
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 569,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
									className: "block text-sm font-medium text-gray-700 mb-1",
									children: "Daily Fooding Allowance (₹)"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 581,
									columnNumber: 15
								}, this), /* @__PURE__ */ _jsxDEV("input", {
									type: "number",
									step: "1",
									value: config.foodingAllowance,
									onChange: (e) => setConfig({
										...config,
										foodingAllowance: parseFloat(e.target.value) || 0
									}),
									className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500",
									required: true
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 582,
									columnNumber: 15
								}, this)] }, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 580,
									columnNumber: 13
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 567,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4",
							children: [
								/* @__PURE__ */ _jsxDEV("h4", {
									className: "font-semibold text-gray-800 border-b border-gray-200 pb-2",
									children: "Advanced Product Incentive Matrix"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 594,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "space-y-2",
									children: [config.incentives.map((product) => /* @__PURE__ */ _jsxDEV("div", {
										className: "flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200",
										children: [
											/* @__PURE__ */ _jsxDEV("div", {
												className: "flex-1 font-medium text-gray-900",
												children: product.name
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 600,
												columnNumber: 19
											}, this),
											/* @__PURE__ */ _jsxDEV("div", {
												className: "text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded",
												children: product.unit
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 601,
												columnNumber: 19
											}, this),
											/* @__PURE__ */ _jsxDEV("div", {
												className: "font-bold text-green-600 w-24 text-right",
												children: ["₹", product.rate]
											}, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 602,
												columnNumber: 19
											}, this),
											/* @__PURE__ */ _jsxDEV("button", {
												type: "button",
												onClick: () => removeProduct(product.id),
												className: "p-1 text-red-500 hover:bg-red-50 rounded",
												children: [/* @__PURE__ */ _jsxDEV(Square, { size: 16 }, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 604,
													columnNumber: 21
												}, this), " "]
											}, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 603,
												columnNumber: 19
											}, this)
										]
									}, product.id, true, {
										fileName: _jsxFileName,
										lineNumber: 599,
										columnNumber: 17
									}, this)), config.incentives.length === 0 && /* @__PURE__ */ _jsxDEV("p", {
										className: "text-sm text-gray-500",
										children: "No products configured."
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 608,
										columnNumber: 50
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 597,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									className: "bg-white p-4 rounded-lg border border-blue-100 mt-4 space-y-4",
									children: [/* @__PURE__ */ _jsxDEV("h5", {
										className: "text-sm font-semibold text-blue-800",
										children: "Add Custom Product"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 613,
										columnNumber: 15
									}, this), /* @__PURE__ */ _jsxDEV("div", {
										className: "grid grid-cols-1 md:grid-cols-3 gap-4",
										children: [
											/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
												className: "block text-xs font-medium text-gray-700 mb-1",
												children: "Product Name"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 616,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV("input", {
												type: "text",
												value: newProduct.name,
												onChange: (e) => setNewProduct({
													...newProduct,
													name: e.target.value
												}),
												placeholder: "e.g. Paint",
												className: "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 617,
												columnNumber: 19
											}, this)] }, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 615,
												columnNumber: 17
											}, this),
											/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
												className: "block text-xs font-medium text-gray-700 mb-1",
												children: "Unit Type"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 620,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV("select", {
												value: newProduct.unit,
												onChange: (e) => setNewProduct({
													...newProduct,
													unit: e.target.value
												}),
												className: "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg",
												children: [
													/* @__PURE__ */ _jsxDEV("option", {
														value: "Bags",
														children: "Bags"
													}, void 0, false, {
														fileName: _jsxFileName,
														lineNumber: 622,
														columnNumber: 21
													}, this),
													/* @__PURE__ */ _jsxDEV("option", {
														value: "Kgs",
														children: "Kgs"
													}, void 0, false, {
														fileName: _jsxFileName,
														lineNumber: 623,
														columnNumber: 21
													}, this),
													/* @__PURE__ */ _jsxDEV("option", {
														value: "Pcs",
														children: "Pcs"
													}, void 0, false, {
														fileName: _jsxFileName,
														lineNumber: 624,
														columnNumber: 21
													}, this),
													/* @__PURE__ */ _jsxDEV("option", {
														value: "MT",
														children: "MT"
													}, void 0, false, {
														fileName: _jsxFileName,
														lineNumber: 625,
														columnNumber: 21
													}, this)
												]
											}, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 621,
												columnNumber: 19
											}, this)] }, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 619,
												columnNumber: 17
											}, this),
											/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
												className: "block text-xs font-medium text-gray-700 mb-1",
												children: "Incentive Rate (₹)"
											}, void 0, false, {
												fileName: _jsxFileName,
												lineNumber: 629,
												columnNumber: 19
											}, this), /* @__PURE__ */ _jsxDEV("div", {
												className: "flex gap-2",
												children: [/* @__PURE__ */ _jsxDEV("input", {
													type: "number",
													value: newProduct.rate,
													onChange: (e) => setNewProduct({
														...newProduct,
														rate: e.target.value
													}),
													placeholder: "Rate",
													className: "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 631,
													columnNumber: 21
												}, this), /* @__PURE__ */ _jsxDEV("button", {
													type: "button",
													onClick: addProduct,
													className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium",
													children: "Add"
												}, void 0, false, {
													fileName: _jsxFileName,
													lineNumber: 632,
													columnNumber: 21
												}, this)]
											}, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 630,
												columnNumber: 19
											}, this)] }, void 0, true, {
												fileName: _jsxFileName,
												lineNumber: 628,
												columnNumber: 17
											}, this)
										]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 614,
										columnNumber: 15
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 612,
									columnNumber: 13
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 593,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("button", {
							type: "submit",
							disabled: saving,
							className: "w-full max-w-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mt-2",
							children: saving ? "Saving Configurations..." : "Save Global Configurations"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 639,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 566,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 556,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 555,
		columnNumber: 5
	}, this);
}
_s4(AdminConfig, "xYNr9n+h0d4pAahIa27RbCq0460=");
_c4 = AdminConfig;
function ProfileSettings({ user, onLogout }) {
	_s5();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState({
		type: "",
		text: ""
	});
	// Form fields
	const [fullName, setFullName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	useEffect(() => {
		fetchProfile();
	}, []);
	const fetchProfile = async () => {
		try {
			const res = await api.get("/user/profile");
			setProfile(res.data);
			setFullName(res.data.fullName || "");
			setPhoneNumber(res.data.phoneNumber || "");
		} catch (err) {
			console.error("Failed to fetch profile", err);
			setMessage({
				type: "error",
				text: "Failed to load profile data."
			});
		} finally {
			setLoading(false);
		}
	};
	const handleUpdate = async (e) => {
		e.preventDefault();
		setSaving(true);
		setMessage({
			type: "",
			text: ""
		});
		try {
			await api.put("/user/update", {
				fullName,
				phoneNumber
			});
			setMessage({
				type: "success",
				text: "Profile updated successfully."
			});
			// Update local profile state as well
			setProfile((prev) => ({
				...prev,
				fullName,
				phoneNumber
			}));
		} catch (err) {
			setMessage({
				type: "error",
				text: err.response?.data?.error || "Failed to update profile."
			});
		} finally {
			setSaving(false);
		}
	};
	if (loading) {
		return /* @__PURE__ */ _jsxDEV("div", {
			className: "py-8 text-center text-gray-500",
			children: "Loading profile..."
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 699,
			columnNumber: 12
		}, this);
	}
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "space-y-6",
		children: [
			profile && /* @__PURE__ */ _jsxDEV("div", {
				className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "bg-blue-100 text-blue-600 p-6 rounded-full flex items-center justify-center",
					children: /* @__PURE__ */ _jsxDEV(User, { size: 48 }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 708,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 707,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "flex-1 text-center md:text-left",
					children: [
						/* @__PURE__ */ _jsxDEV("h2", {
							className: "text-2xl font-bold text-gray-900",
							children: profile.fullName
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 711,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("p", {
							className: "text-gray-500 mb-4",
							children: [
								profile.role,
								" • ",
								profile.email
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 712,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "grid grid-cols-2 gap-4 text-left border-t border-gray-100 pt-4",
							children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs text-gray-400 uppercase font-bold tracking-wider mb-1",
								children: "Employee ID"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 716,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium text-gray-900",
								children: profile.employeeId || "N/A"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 717,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 715,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("p", {
								className: "text-xs text-gray-400 uppercase font-bold tracking-wider mb-1",
								children: "Assigned Manager"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 720,
								columnNumber: 17
							}, this), /* @__PURE__ */ _jsxDEV("p", {
								className: "font-medium text-gray-900",
								children: profile.assignedSupervisor
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 721,
								columnNumber: 17
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 719,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 714,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 710,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 706,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100",
				children: [
					/* @__PURE__ */ _jsxDEV("h3", {
						className: "text-lg font-bold text-gray-900 mb-6",
						children: "Account Settings"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 730,
						columnNumber: 9
					}, this),
					message.text && /* @__PURE__ */ _jsxDEV("div", {
						className: `p-4 rounded-xl mb-6 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`,
						children: message.text
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 733,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ _jsxDEV("form", {
						onSubmit: handleUpdate,
						className: "space-y-4 max-w-lg",
						children: [
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
								className: "block text-sm font-medium text-gray-700 mb-1",
								children: "Full Name"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 740,
								columnNumber: 13
							}, this), /* @__PURE__ */ _jsxDEV("input", {
								type: "text",
								value: fullName,
								onChange: (e) => setFullName(e.target.value),
								className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
								required: true
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 741,
								columnNumber: 13
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 739,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("label", {
								className: "block text-sm font-medium text-gray-700 mb-1",
								children: "Phone Number"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 750,
								columnNumber: 13
							}, this), /* @__PURE__ */ _jsxDEV("input", {
								type: "text",
								value: phoneNumber,
								onChange: (e) => setPhoneNumber(e.target.value),
								className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
								required: true
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 751,
								columnNumber: 13
							}, this)] }, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 749,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("button", {
								type: "submit",
								disabled: saving,
								className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-70 mt-2",
								children: saving ? "Saving Changes..." : "Update Details"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 759,
								columnNumber: 11
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 738,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 729,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "bg-white p-6 rounded-2xl shadow-sm border border-red-100 mt-8",
				children: [
					/* @__PURE__ */ _jsxDEV("h3", {
						className: "text-lg font-bold text-red-600 mb-2",
						children: "Session Management"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 771,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("p", {
						className: "text-gray-500 text-sm mb-6",
						children: "Securely log out of your field executive portal. You will need your credentials to access your dashboard again."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 772,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("button", {
						onClick: onLogout,
						className: "w-full sm:w-auto flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 px-6 rounded-xl transition-colors",
						children: [/* @__PURE__ */ _jsxDEV(LogOut, { size: 20 }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 777,
							columnNumber: 11
						}, this), "Sign Out Now"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 773,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 770,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 703,
		columnNumber: 5
	}, this);
}
_s5(ProfileSettings, "dn/IbbwABSkJotnz5imT07kDsg8=");
_c5 = ProfileSettings;
var _c, _c2, _c3, _c4, _c5;
$RefreshReg$(_c, "App");
$RefreshReg$(_c2, "Login");
$RefreshReg$(_c3, "AdminUMS");
$RefreshReg$(_c4, "AdminConfig");
$RefreshReg$(_c5, "ProfileSettings");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/App.jsx?t=1787212924211";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/app/applet/src/App.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/app/applet/src/App.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/app/applet/src/App.jsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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V0FBVTtnQkFGWixDQUlFLHdCQUFDLFFBQUQsRUFBUSxNQUFNLEdBQUs7Ozs7Z0JBQUMsY0FFZDs7Ozs7O0lBQ0w7Ozs7OztFQUNGOzs7Ozs7QUFFVCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJBcHAuanN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7IExvZ091dCwgTmF2aWdhdGlvbiwgUGxheSwgU3F1YXJlLCBGaWxlVGV4dCwgQ2hlY2tDaXJjbGUsIEhpc3RvcnksIFNlYXJjaCwgVHJlbmRpbmdVcCwgSW5kaWFuUnVwZWUsIFVzZXIsIFN0b3JlLCBNYXBQaW4sIENhbGVuZGFyLCBTZXR0aW5ncywgVXNlcnMsIEFjdGl2aXR5LCBCYXJDaGFydCwgU2V0dGluZ3MyIH0gZnJvbSAnbHVjaWRlLXJlYWN0JztcblxuY29uc3QgYXBpID0gYXhpb3MuY3JlYXRlKHtcbiAgYmFzZVVSTDogJy9hcGknIC8vIHVzaW5nIHJlbGF0aXZlIHBhdGggYmVjYXVzZSB0aGV5IGFyZSBvbiB0aGUgc2FtZSBzZXJ2ZXIhXG59KTtcblxuYXBpLmludGVyY2VwdG9ycy5yZXF1ZXN0LnVzZShjb25maWcgPT4ge1xuICBjb25zdCB0b2tlbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuICBpZiAodG9rZW4pIHtcbiAgICBjb25maWcuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJlYXJlciAke3Rva2VufWA7XG4gIH1cbiAgcmV0dXJuIGNvbmZpZztcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoKSB7XG4gIGNvbnN0IFt1c2VyLCBzZXRVc2VyXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbdG9rZW4sIHNldFRva2VuXSA9IHVzZVN0YXRlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpIHx8ICcnKTtcbiAgY29uc3QgW2N1cnJlbnRQYWdlLCBzZXRDdXJyZW50UGFnZV0gPSB1c2VTdGF0ZSgnZGFzaGJvYXJkJyk7XG4gIGNvbnN0IFtsb2NhdGlvbkVycm9yLCBzZXRMb2NhdGlvbkVycm9yXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2lzQnlwYXNzZWQsIHNldElzQnlwYXNzZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHRva2VuKSB7XG4gICAgICBjb25zdCBzdG9yZWRVc2VyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKTtcbiAgICAgIGlmIChzdG9yZWRVc2VyKSBzZXRVc2VyKEpTT04ucGFyc2Uoc3RvcmVkVXNlcikpO1xuICAgIH1cbiAgfSwgW3Rva2VuXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXRva2VuKSByZXR1cm47XG5cbiAgICBsZXQgd2F0Y2hJZDtcbiAgICBpZiAoXCJnZW9sb2NhdGlvblwiIGluIG5hdmlnYXRvcikge1xuICAgICAgd2F0Y2hJZCA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKFxuICAgICAgICAocG9zaXRpb24pID0+IHNldExvY2F0aW9uRXJyb3IoZmFsc2UpLFxuICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdHZW9sb2NhdGlvbiBlcnJvcjonLCBlcnJvci5tZXNzYWdlIHx8IGVycm9yKTtcbiAgICAgICAgICBzZXRMb2NhdGlvbkVycm9yKHRydWUpO1xuICAgICAgICB9LFxuICAgICAgICB7IGVuYWJsZUhpZ2hBY2N1cmFjeTogdHJ1ZSwgbWF4aW11bUFnZTogMTAwMDAsIHRpbWVvdXQ6IDUwMDAgfVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0TG9jYXRpb25FcnJvcih0cnVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgaWYgKHdhdGNoSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaCh3YXRjaElkKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbdG9rZW5dKTtcblxuICBjb25zdCBoYW5kbGVMb2dvdXQgPSAoKSA9PiB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICBzZXRUb2tlbignJyk7XG4gICAgc2V0VXNlcihudWxsKTtcbiAgfTtcblxuICBpZiAoIXRva2VuKSB7XG4gICAgcmV0dXJuIDxMb2dpbiBvbkxvZ2luPXsodCwgdSkgPT4ge1xuICAgICAgc2V0VG9rZW4odCk7XG4gICAgICBzZXRVc2VyKHUpO1xuICAgIH19IC8+O1xuICB9XG5cbiAgaWYgKCF1c2VyKSB7XG4gICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGJnLWdyYXktNTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdGV4dC1ncmF5LTUwMFwiPkxvYWRpbmcuLi48L2Rpdj47XG4gIH1cblxuICBpZiAobG9jYXRpb25FcnJvciAmJiAhaXNCeXBhc3NlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1ncmF5LTkwMCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTYgdGV4dC1jZW50ZXIgei01MFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtOCByb3VuZGVkLTJ4bCBtYXgtdy1zbSB3LWZ1bGwgc2hhZG93LTJ4bCBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy0xNiBoLTE2IGJnLXJlZC0xMDAgdGV4dC1yZWQtNjAwIHJvdW5kZWQtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBtYi02XCI+XG4gICAgICAgICAgICA8TmF2aWdhdGlvbiBzaXplPXszMn0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC1ncmF5LTkwMCBtYi0yXCI+R1BTIFJlcXVpcmVkPC9oMj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNjAwIG1iLTYgdGV4dC1zbVwiPlxuICAgICAgICAgICAgUGxlYXNlIGVuYWJsZSBsb2NhdGlvbiBzZXJ2aWNlcyBhbmQgZ3JhbnQgR1BTIHBlcm1pc3Npb25zIHRvIHVzZSB0aGUgRmllbGQgRXhlY3V0aXZlIHBvcnRhbC5cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBiZy1ibHVlLTYwMCBob3ZlcjpiZy1ibHVlLTcwMCB0ZXh0LXdoaXRlIGZvbnQtbWVkaXVtIHB5LTMgcHgtNCByb3VuZGVkLXhsIHRyYW5zaXRpb24tY29sb3JzIG1iLTNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIENoZWNrIEFnYWluXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzQnlwYXNzZWQodHJ1ZSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctZ3JheS0xMDAgaG92ZXI6YmctZ3JheS0yMDAgdGV4dC1ncmF5LTcwMCBmb250LW1lZGl1bSBweS0zIHB4LTQgcm91bmRlZC14bCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgQnlwYXNzIGZvciBUZXN0aW5nXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGlzQWRtaW4gPSB1c2VyICYmIHVzZXIucm9sZSA9PT0gJ0FETUlOJztcblxuICBjb25zdCByZW5kZXJQYWdlID0gKCkgPT4ge1xuICAgIGlmIChpc0FkbWluKSB7XG4gICAgICBzd2l0Y2ggKGN1cnJlbnRQYWdlKSB7XG4gICAgICAgIGNhc2UgJ2FkbWluLWRhc2hib2FyZCc6IHJldHVybiA8QWRtaW5EYXNoYm9hcmQgdXNlcj17dXNlcn0gLz47XG4gICAgICAgIGNhc2UgJ2FkbWluLWNvbmZpZyc6IHJldHVybiA8QWRtaW5Db25maWcgdXNlcj17dXNlcn0gLz47XG4gICAgICAgIGNhc2UgJ2FkbWluLXVtcyc6IHJldHVybiA8QWRtaW5VTVMgdXNlcj17dXNlcn0gLz47XG4gICAgICAgIGNhc2UgJ3Byb2ZpbGUnOiByZXR1cm4gPFByb2ZpbGVTZXR0aW5ncyB1c2VyPXt1c2VyfSBvbkxvZ291dD17aGFuZGxlTG9nb3V0fSAvPjtcbiAgICAgICAgZGVmYXVsdDogcmV0dXJuIDxBZG1pbkRhc2hib2FyZCB1c2VyPXt1c2VyfSAvPjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChjdXJyZW50UGFnZSkge1xuICAgICAgICBjYXNlICdkYXNoYm9hcmQnOiByZXR1cm4gPFNoaWZ0RGFzaGJvYXJkIHVzZXI9e3VzZXJ9IC8+O1xuICAgICAgICBjYXNlICd2aXNpdHMnOiByZXR1cm4gPFZpc2l0TG9nZ2VyIHVzZXI9e3VzZXJ9IC8+O1xuICAgICAgICBjYXNlICdoaXN0b3J5JzogcmV0dXJuIDxWaXNpdEhpc3RvcnkgdXNlcj17dXNlcn0gLz47XG4gICAgICAgIGNhc2UgJ2luY2VudGl2ZXMnOiByZXR1cm4gPEluY2VudGl2ZXNEYXNoYm9hcmQgdXNlcj17dXNlcn0gLz47XG4gICAgICAgIGNhc2UgJ29uYm9hcmQnOiByZXR1cm4gPEZpcm1PbmJvYXJkaW5nIHVzZXI9e3VzZXJ9IC8+O1xuICAgICAgICBjYXNlICdwcm9maWxlJzogcmV0dXJuIDxQcm9maWxlU2V0dGluZ3MgdXNlcj17dXNlcn0gb25Mb2dvdXQ9e2hhbmRsZUxvZ291dH0gLz47XG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiA8U2hpZnREYXNoYm9hcmQgdXNlcj17dXNlcn0gLz47XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gYmctZ3JheS01MCBmbGV4IGZsZXgtY29sIGZvbnQtc2FucyByZWxhdGl2ZSBwYi0yMFwiPlxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJiZy13aGl0ZSBib3JkZXItYiBib3JkZXItZ3JheS0yMDAgcHgtNiBweS00IGZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBzdGlja3kgdG9wLTAgei0xMCBzaGFkb3ctc21cIj5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJsYWNrIHRleHQtZ3JheS05MDAgdHJhY2tpbmctdGlnaHQgbGVhZGluZy1ub25lXCI+XG4gICAgICAgICAgICB7aXNBZG1pbiA/ICdBRE1JTiBDT05UUk9MJyA6ICdTTU0gUE9SVEFMJ31cbiAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTUwMCBmb250LW1lZGl1bSBtdC0xXCI+XG4gICAgICAgICAgICB7aXNBZG1pbiA/ICdTdW5kYXJhbSBNYWhhZGVvIEdyb3VwJyA6IGAke3VzZXIuZnVsbF9uYW1lfSDigKIgRmllbGQgRXhlY2B9XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVMb2dvdXR9XG4gICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHRleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1yZWQtNjAwIGhvdmVyOmJnLXJlZC01MCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgIHRpdGxlPVwiTG9nb3V0XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxMb2dPdXQgc2l6ZT17MjB9IC8+XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9oZWFkZXI+XG4gICAgICBcbiAgICAgIDxtYWluIGNsYXNzTmFtZT1cImZsZXgtMSBwLTYgbWF4LXctNHhsIG14LWF1dG8gdy1mdWxsXCI+XG4gICAgICAgIHtyZW5kZXJQYWdlKCl9XG4gICAgICA8L21haW4+XG5cbiAgICAgIHtpc0FkbWluID8gKFxuICAgICAgICA8bmF2IGNsYXNzTmFtZT1cImZpeGVkIGJvdHRvbS0wIHctZnVsbCBtYXgtdy00eGwgbXgtYXV0byBiZy13aGl0ZSBib3JkZXItdCBib3JkZXItZ3JheS0yMDAgZ3JpZCBncmlkLWNvbHMtNCBwLTIgei0xMCBzaGFkb3ctWzBfLTRweF82cHhfLTFweF9yZ2IoMCwwLDAsMC4wNSldXCI+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEN1cnJlbnRQYWdlKCdhZG1pbi1kYXNoYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHNwYWNlLXktMSAke2N1cnJlbnRQYWdlID09PSAnYWRtaW4tZGFzaGJvYXJkJyB8fCBjdXJyZW50UGFnZSA9PT0gJ2Rhc2hib2FyZCcgPyAndGV4dC1ibHVlLTYwMCcgOiAndGV4dC1ncmF5LTUwMCBob3Zlcjp0ZXh0LWdyYXktOTAwJ31gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxBY3Rpdml0eSBzaXplPXsyMH0gLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtbWVkaXVtIHRydW5jYXRlIHctZnVsbCB0ZXh0LWNlbnRlclwiPkRhc2hib2FyZDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVudFBhZ2UoJ2FkbWluLWNvbmZpZycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgc3BhY2UteS0xICR7Y3VycmVudFBhZ2UgPT09ICdhZG1pbi1jb25maWcnID8gJ3RleHQtYmx1ZS02MDAnIDogJ3RleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1ncmF5LTkwMCd9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8U2V0dGluZ3MyIHNpemU9ezIwfSAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdHJ1bmNhdGUgdy1mdWxsIHRleHQtY2VudGVyXCI+Q29uZmlnPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRDdXJyZW50UGFnZSgnYWRtaW4tdW1zJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBzcGFjZS15LTEgJHtjdXJyZW50UGFnZSA9PT0gJ2FkbWluLXVtcycgPyAndGV4dC1ibHVlLTYwMCcgOiAndGV4dC1ncmF5LTUwMCBob3Zlcjp0ZXh0LWdyYXktOTAwJ31gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxVc2VycyBzaXplPXsyMH0gLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtbWVkaXVtIHRydW5jYXRlIHctZnVsbCB0ZXh0LWNlbnRlclwiPlVNUzwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVudFBhZ2UoJ3Byb2ZpbGUnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHNwYWNlLXktMSAke2N1cnJlbnRQYWdlID09PSAncHJvZmlsZScgPyAndGV4dC1ibHVlLTYwMCcgOiAndGV4dC1ncmF5LTUwMCBob3Zlcjp0ZXh0LWdyYXktOTAwJ31gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxVc2VyIHNpemU9ezIwfSAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdHJ1bmNhdGUgdy1mdWxsIHRleHQtY2VudGVyXCI+UHJvZmlsZTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9uYXY+XG4gICAgICApIDogKFxuICAgICAgICA8bmF2IGNsYXNzTmFtZT1cImZpeGVkIGJvdHRvbS0wIHctZnVsbCBtYXgtdy00eGwgbXgtYXV0byBiZy13aGl0ZSBib3JkZXItdCBib3JkZXItZ3JheS0yMDAgZ3JpZCBncmlkLWNvbHMtNiBwLTIgei0xMCBzaGFkb3ctWzBfLTRweF82cHhfLTFweF9yZ2IoMCwwLDAsMC4wNSldXCI+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEN1cnJlbnRQYWdlKCdkYXNoYm9hcmQnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHNwYWNlLXktMSAke2N1cnJlbnRQYWdlID09PSAnZGFzaGJvYXJkJyA/ICd0ZXh0LWJsdWUtNjAwJyA6ICd0ZXh0LWdyYXktNTAwIGhvdmVyOnRleHQtZ3JheS05MDAnfWB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPE5hdmlnYXRpb24gc2l6ZT17MjB9IC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LW1lZGl1bSB0cnVuY2F0ZSB3LWZ1bGwgdGV4dC1jZW50ZXJcIj5TaGlmdDwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVudFBhZ2UoJ3Zpc2l0cycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgc3BhY2UteS0xICR7Y3VycmVudFBhZ2UgPT09ICd2aXNpdHMnID8gJ3RleHQtYmx1ZS02MDAnIDogJ3RleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1ncmF5LTkwMCd9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8Q2hlY2tDaXJjbGUgc2l6ZT17MjB9IC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LW1lZGl1bSB0cnVuY2F0ZSB3LWZ1bGwgdGV4dC1jZW50ZXJcIj5Mb2cgVmlzaXQ8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEN1cnJlbnRQYWdlKCdoaXN0b3J5Jyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBzcGFjZS15LTEgJHtjdXJyZW50UGFnZSA9PT0gJ2hpc3RvcnknID8gJ3RleHQtYmx1ZS02MDAnIDogJ3RleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1ncmF5LTkwMCd9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8SGlzdG9yeSBzaXplPXsyMH0gLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtbWVkaXVtIHRydW5jYXRlIHctZnVsbCB0ZXh0LWNlbnRlclwiPkhpc3Rvcnk8L3NwYW4+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEN1cnJlbnRQYWdlKCdvbmJvYXJkJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBzcGFjZS15LTEgJHtjdXJyZW50UGFnZSA9PT0gJ29uYm9hcmQnID8gJ3RleHQtYmx1ZS02MDAnIDogJ3RleHQtZ3JheS01MDAgaG92ZXI6dGV4dC1ncmF5LTkwMCd9YH1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8U3RvcmUgc2l6ZT17MjB9IC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LW1lZGl1bSB0cnVuY2F0ZSB3LWZ1bGwgdGV4dC1jZW50ZXJcIj5PbmJvYXJkPC9zcGFuPlxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRDdXJyZW50UGFnZSgnaW5jZW50aXZlcycpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgc3BhY2UteS0xICR7Y3VycmVudFBhZ2UgPT09ICdpbmNlbnRpdmVzJyA/ICd0ZXh0LWJsdWUtNjAwJyA6ICd0ZXh0LWdyYXktNTAwIGhvdmVyOnRleHQtZ3JheS05MDAnfWB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFRyZW5kaW5nVXAgc2l6ZT17MjB9IC8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LW1lZGl1bSB0cnVuY2F0ZSB3LWZ1bGwgdGV4dC1jZW50ZXJcIj5QICYgSTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVudFBhZ2UoJ3Byb2ZpbGUnKX1cbiAgICAgICAgICAgIGNsYXNzTmFtZT17YGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHNwYWNlLXktMSAke2N1cnJlbnRQYWdlID09PSAncHJvZmlsZScgPyAndGV4dC1ibHVlLTYwMCcgOiAndGV4dC1ncmF5LTUwMCBob3Zlcjp0ZXh0LWdyYXktOTAwJ31gfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxVc2VyIHNpemU9ezIwfSAvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1tZWRpdW0gdHJ1bmNhdGUgdy1mdWxsIHRleHQtY2VudGVyXCI+UHJvZmlsZTwvc3Bhbj5cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9uYXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBMb2dpbih7IG9uTG9naW4gfSkge1xuICBjb25zdCBbaXNSZWdpc3RlcmluZywgc2V0SXNSZWdpc3RlcmluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtmdWxsTmFtZSwgc2V0RnVsbE5hbWVdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbcGhvbmVOdW1iZXIsIHNldFBob25lTnVtYmVyXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2VtYWlsT3JQaG9uZSwgc2V0RW1haWxPclBob25lXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Bhc3N3b3JkLCBzZXRQYXNzd29yZF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gYXN5bmMgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICBzZXRFcnJvcignJyk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChpc1JlZ2lzdGVyaW5nKSB7XG4gICAgICAgIGF3YWl0IGFwaS5wb3N0KCcvYXV0aC9yZWdpc3RlcicsIHsgXG4gICAgICAgICAgZnVsbE5hbWUsIFxuICAgICAgICAgIHBob25lTnVtYmVyLCBcbiAgICAgICAgICBlbWFpbDogZW1haWxPclBob25lLCBcbiAgICAgICAgICBwYXNzd29yZCwgXG4gICAgICAgICAgcm9sZTogJ0VYRUNVVElWRScgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCBsb2dpblJlcyA9IGF3YWl0IGFwaS5wb3N0KCcvYXV0aC9sb2dpbicsIHsgZW1haWxPclBob25lLCBwYXNzd29yZCB9KTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIGxvZ2luUmVzLmRhdGEudG9rZW4pO1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeShsb2dpblJlcy5kYXRhLnVzZXIpKTtcbiAgICAgIG9uTG9naW4obG9naW5SZXMuZGF0YS50b2tlbiwgbG9naW5SZXMuZGF0YS51c2VyKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNldEVycm9yKGVyci5yZXNwb25zZT8uZGF0YT8uZXJyb3IgfHwgJ0F1dGhlbnRpY2F0aW9uIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi4nKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJtaW4taC1zY3JlZW4gYmctZ3JheS0xMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcC00XCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHAtOCByb3VuZGVkLTJ4bCBzaGFkb3cteGwgdy1mdWxsIG1heC13LW1kXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWNlbnRlciBtYi02XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLTE2IHctMTYgYmctYmx1ZS02MDAgcm91bmRlZC1mdWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHNoYWRvdy1sZ1wiPlxuICAgICAgICAgICAgPE5hdmlnYXRpb24gY2xhc3NOYW1lPVwidGV4dC13aGl0ZSB3LTggaC04XCIgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1jZW50ZXIgdGV4dC1ncmF5LTkwMCBtYi04XCI+XG4gICAgICAgICAge2lzUmVnaXN0ZXJpbmcgPyAnQ3JlYXRlIEV4ZWN1dGl2ZSBBY2NvdW50JyA6ICdTTU0gRXhlY3V0aXZlIExvZ2luJ31cbiAgICAgICAgPC9oMj5cbiAgICAgICAge2Vycm9yICYmIDxkaXYgY2xhc3NOYW1lPVwiYmctcmVkLTUwIHRleHQtcmVkLTYwMCBwLTMgcm91bmRlZC1sZyBtYi02IHRleHQtc21cIj57ZXJyb3J9PC9kaXY+fVxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU3VibWl0fSBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICB7aXNSZWdpc3RlcmluZyAmJiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTFcIj5GdWxsIE5hbWU8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICB2YWx1ZT17ZnVsbE5hbWV9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0RnVsbE5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOmJvcmRlci1ibHVlLTUwMFwiXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ9e2lzUmVnaXN0ZXJpbmd9IFxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7aXNSZWdpc3RlcmluZyAmJiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTFcIj5QaG9uZSBOdW1iZXI8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICB2YWx1ZT17cGhvbmVOdW1iZXJ9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0UGhvbmVOdW1iZXIoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOmJvcmRlci1ibHVlLTUwMFwiXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ9e2lzUmVnaXN0ZXJpbmd9IFxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+XG4gICAgICAgICAgICAgIHtpc1JlZ2lzdGVyaW5nID8gJ0VtYWlsIEFkZHJlc3MnIDogJ0VtYWlsIG9yIFBob25lJ31cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgIHZhbHVlPXtlbWFpbE9yUGhvbmV9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldEVtYWlsT3JQaG9uZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOmJvcmRlci1ibHVlLTUwMFwiXG4gICAgICAgICAgICAgIHJlcXVpcmVkIFxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+UGFzc3dvcmQ8L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIiBcbiAgICAgICAgICAgICAgdmFsdWU9e3Bhc3N3b3JkfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRQYXNzd29yZChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOmJvcmRlci1ibHVlLTUwMFwiXG4gICAgICAgICAgICAgIHJlcXVpcmVkIFxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiIFxuICAgICAgICAgICAgZGlzYWJsZWQ9e2xvYWRpbmd9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctYmx1ZS02MDAgaG92ZXI6YmctYmx1ZS03MDAgdGV4dC13aGl0ZSBmb250LW1lZGl1bSBweS0zIHB4LTQgcm91bmRlZC1sZyB0cmFuc2l0aW9uLWNvbG9ycyBkaXNhYmxlZDpvcGFjaXR5LTcwIG10LTRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtsb2FkaW5nID8gJ1Byb2Nlc3NpbmcuLi4nIDogKGlzUmVnaXN0ZXJpbmcgPyAnUmVnaXN0ZXIgJiBMb2dpbicgOiAnU3RhcnQgU2Vzc2lvbicpfVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNiB0ZXh0LWNlbnRlclwiPlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzUmVnaXN0ZXJpbmcoIWlzUmVnaXN0ZXJpbmcpfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1ibHVlLTYwMCBob3Zlcjp0ZXh0LWJsdWUtODAwIHRleHQtc20gZm9udC1tZWRpdW0gdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtpc1JlZ2lzdGVyaW5nID8gJ0FscmVhZHkgaGF2ZSBhbiBhY2NvdW50PyBMb2dpbicgOiAnTmVlZCBhbiBhY2NvdW50PyBSZWdpc3Rlcid9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cblxuXG5mdW5jdGlvbiBBZG1pblVNUyh7IHVzZXIgfSkge1xuICBjb25zdCBbdXNlcnMsIHNldFVzZXJzXSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtzdGF0dXNGaWx0ZXIsIHNldFN0YXR1c0ZpbHRlcl0gPSB1c2VTdGF0ZSgnUEVORElORycpOyAvLyBQRU5ESU5HLCBBQ1RJVkUsIERJU0FCTEVEXG4gIGNvbnN0IFtlZGl0VXNlciwgc2V0RWRpdFVzZXJdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtlZGl0Rm9ybSwgc2V0RWRpdEZvcm1dID0gdXNlU3RhdGUoeyByb2xlOiAnRVhFQ1VUSVZFJywgc3VwZXJ2aXNvcjogJycsIHN0YXR1czogJ0FDVElWRScgfSk7XG4gIGNvbnN0IFttZXNzYWdlLCBzZXRNZXNzYWdlXSA9IHVzZVN0YXRlKCcnKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZldGNoVXNlcnMoKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGZldGNoVXNlcnMgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgYXBpLmdldCgnL2FkbWluL3VzZXJzJyk7XG4gICAgICAvLyBGb3IgbW9jayB1c2VycyBjcmVhdGVkIHZpYSBhcHAsIHN0YXR1cyBtaWdodCBiZSB1bmRlZmluZWQgaWYgY3JlYXRlZCBiZWZvcmUgb3VyIHBhdGNoLiBGaXggdGhhdCBvbiBjbGllbnQgc2lkZS5cbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRVc2VycyA9IHJlcy5kYXRhLnVzZXJzLm1hcCh1ID0+ICh7IC4uLnUsIHN0YXR1czogdS5zdGF0dXMgfHwgKHUucm9sZSA9PT0gJ0FETUlOJyA/ICdBQ1RJVkUnIDogJ1BFTkRJTkcnKSB9KSk7XG4gICAgICBzZXRVc2Vycyhub3JtYWxpemVkVXNlcnMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGZldGNoIHVzZXJzJywgZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZUFwcHJvdmUgPSBhc3luYyAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBzZXRNZXNzYWdlKCcnKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXBpLnB1dChgL2FkbWluL3VzZXJzLyR7ZWRpdFVzZXIudXNlcl9pZH0vYXBwcm92ZWAsIGVkaXRGb3JtKTtcbiAgICAgIHNldE1lc3NhZ2UoJ1VzZXIgdXBkYXRlZCBzdWNjZXNzZnVsbHkuJyk7XG4gICAgICBzZXRFZGl0VXNlcihudWxsKTtcbiAgICAgIGZldGNoVXNlcnMoKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0TWVzc2FnZSgnJyksIDMwMDApO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0TWVzc2FnZSgnRmFpbGVkIHRvIHVwZGF0ZSB1c2VyLicpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBmaWx0ZXJlZFVzZXJzID0gdXNlcnMuZmlsdGVyKHUgPT4gdS5zdGF0dXMgPT09IHN0YXR1c0ZpbHRlcik7XG5cbiAgaWYgKGxvYWRpbmcpIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cInB5LTggdGV4dC1jZW50ZXIgdGV4dC1ncmF5LTUwMFwiPkxvYWRpbmcgdXNlcnMuLi48L2Rpdj47XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IHAtMSBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLWdyYXktMjAwIHJvdW5kZWQteGwgbWF4LXctc20gc2hhZG93LXNtXCI+XG4gICAgICAgIHtbJ1BFTkRJTkcnLCAnQUNUSVZFJywgJ0RJU0FCTEVEJ10ubWFwKHN0YXR1cyA9PiAoXG4gICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgIGtleT17c3RhdHVzfVxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U3RhdHVzRmlsdGVyKHN0YXR1cyl9IFxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTIgdGV4dC14cyBmb250LWJvbGQgdXBwZXJjYXNlIHJvdW5kZWQtbGcgdHJhbnNpdGlvbi1jb2xvcnMgJHtzdGF0dXNGaWx0ZXIgPT09IHN0YXR1cyA/ICdiZy1ibHVlLTUwIHRleHQtYmx1ZS03MDAgc2hhZG93LXNtJyA6ICd0ZXh0LWdyYXktNTAwIGhvdmVyOnRleHQtZ3JheS05MDAnfWB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge3N0YXR1c31cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cblxuICAgICAge21lc3NhZ2UgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YHAtNCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1tZWRpdW0gJHttZXNzYWdlLmluY2x1ZGVzKCdGYWlsZWQnKSA/ICdiZy1yZWQtNTAgdGV4dC1yZWQtNzAwJyA6ICdiZy1ncmVlbi01MCB0ZXh0LWdyZWVuLTcwMCd9YH0+XG4gICAgICAgICAge21lc3NhZ2V9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge2VkaXRVc2VyICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBwLTYgcm91bmRlZC0yeGwgc2hhZG93LXNtIGJvcmRlciBib3JkZXItZ3JheS0yMDAgYW5pbWF0ZS1pbiBmYWRlLWluIHpvb20taW4tOTVcIj5cbiAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJvbGQgdGV4dC1ncmF5LTkwMCBtYi00XCI+RWRpdCBVc2VyOiB7ZWRpdFVzZXIuZnVsbF9uYW1lfTwvaDM+XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2hhbmRsZUFwcHJvdmV9IGNsYXNzTmFtZT1cInNwYWNlLXktNCBtYXgtdy1zbVwiPlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+U3RhdHVzPC9sYWJlbD5cbiAgICAgICAgICAgICAgPHNlbGVjdCB2YWx1ZT17ZWRpdEZvcm0uc3RhdHVzfSBvbkNoYW5nZT17ZSA9PiBzZXRFZGl0Rm9ybSh7Li4uZWRpdEZvcm0sIHN0YXR1czogZS50YXJnZXQudmFsdWV9KX0gY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiBib3JkZXIgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWQtbGdcIj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiUEVORElOR1wiPlBlbmRpbmcgQXBwcm92YWw8L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiQUNUSVZFXCI+QWN0aXZlPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkRJU0FCTEVEXCI+RGlzYWJsZWQ8L29wdGlvbj5cbiAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS03MDAgbWItMVwiPkR1dHkgLyBSb2xlPC9sYWJlbD5cbiAgICAgICAgICAgICAgPHNlbGVjdCB2YWx1ZT17ZWRpdEZvcm0ucm9sZX0gb25DaGFuZ2U9e2UgPT4gc2V0RWRpdEZvcm0oey4uLmVkaXRGb3JtLCByb2xlOiBlLnRhcmdldC52YWx1ZX0pfSBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtNCBweS0yIGJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1sZ1wiPlxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJFWEVDVVRJVkVcIj5GaWVsZCBFeGVjdXRpdmU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiTUFOQUdFUlwiPk1hbmFnZXI8L29wdGlvbj5cbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiQURNSU5cIj5BZG1pbjwvb3B0aW9uPlxuICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+QXNzaWduIFN1cGVydmlzb3I8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT17ZWRpdEZvcm0uc3VwZXJ2aXNvcn0gb25DaGFuZ2U9e2UgPT4gc2V0RWRpdEZvcm0oey4uLmVkaXRGb3JtLCBzdXBlcnZpc29yOiBlLnRhcmdldC52YWx1ZX0pfSBwbGFjZWhvbGRlcj1cImUuZy4gUmFtZXNoIEt1bWFyXCIgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiBib3JkZXIgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWQtbGdcIiByZXF1aXJlZCAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTMgcHQtMlwiPlxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIiBjbGFzc05hbWU9XCJmbGV4LTEgYmctYmx1ZS02MDAgaG92ZXI6YmctYmx1ZS03MDAgdGV4dC13aGl0ZSBmb250LW1lZGl1bSBweS0yIHJvdW5kZWQtbGdcIj5TYXZlIENoYW5nZXM8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgb25DbGljaz17KCkgPT4gc2V0RWRpdFVzZXIobnVsbCl9IGNsYXNzTmFtZT1cImZsZXgtMSBiZy1ncmF5LTEwMCBob3ZlcjpiZy1ncmF5LTIwMCB0ZXh0LWdyYXktNzAwIGZvbnQtbWVkaXVtIHB5LTIgcm91bmRlZC1sZ1wiPkNhbmNlbDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9mb3JtPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcm91bmRlZC0yeGwgc2hhZG93LXNtIGJvcmRlciBib3JkZXItZ3JheS0xMDAgb3ZlcmZsb3ctaGlkZGVuXCI+XG4gICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1sZWZ0IHRleHQtc21cIj5cbiAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwiYmctZ3JheS01MCBib3JkZXItYiBib3JkZXItZ3JheS0xMDBcIj5cbiAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNTAwXCI+XG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTQgZm9udC1tZWRpdW1cIj5OYW1lIC8gQ29udGFjdDwvdGg+XG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTQgZm9udC1tZWRpdW1cIj5Sb2xlIC8gU3VwZXJ2aXNvcjwvdGg+XG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTQgZm9udC1tZWRpdW1cIj5BY3Rpb248L3RoPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgIHtmaWx0ZXJlZFVzZXJzLm1hcCh1ID0+IChcbiAgICAgICAgICAgICAgPHRyIGtleT17dS51c2VyX2lkfSBjbGFzc05hbWU9XCJib3JkZXItYiBib3JkZXItZ3JheS01MCBob3ZlcjpiZy1ncmF5LTUwXCI+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWdyYXktOTAwXCI+e3UuZnVsbF9uYW1lfTwvcD5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTUwMFwiPnt1LnBob25lX251bWJlcn08L3A+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bSB0ZXh0LWdyYXktODAwXCI+e3Uucm9sZX08L3A+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS01MDBcIj57dS5zdXBlcnZpc29yIHx8ICdVbmFzc2lnbmVkJ308L3A+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC00XCI+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFVzZXIodSk7XG4gICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEZvcm0oeyByb2xlOiB1LnJvbGUsIHN1cGVydmlzb3I6IHUuc3VwZXJ2aXNvciB8fCAnJywgc3RhdHVzOiB1LnN0YXR1cyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1ibHVlLTYwMCBob3Zlcjp0ZXh0LWJsdWUtODAwIGZvbnQtbWVkaXVtIHRleHQteHMgYmctYmx1ZS01MCBob3ZlcjpiZy1ibHVlLTEwMCBweC0zIHB5LTEuNSByb3VuZGVkLW1kIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge3Uuc3RhdHVzID09PSAnUEVORElORycgPyAnQXBwcm92ZSBVc2VyJyA6ICdNYW5hZ2UnfVxuICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgICAge2ZpbHRlcmVkVXNlcnMubGVuZ3RoID09PSAwICYmIChcbiAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgIDx0ZCBjb2xTcGFuPVwiM1wiIGNsYXNzTmFtZT1cInAtOCB0ZXh0LWNlbnRlciB0ZXh0LWdyYXktNTAwXCI+Tm8gdXNlcnMgZm91bmQgaW4gdGhpcyBzdGF0dXMuPC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgPC90YWJsZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBBZG1pbkNvbmZpZyh7IHVzZXIgfSkge1xuICBjb25zdCBbY29uZmlnLCBzZXRDb25maWddID0gdXNlU3RhdGUoeyBrbVJhdGU6ICcnLCBmb29kaW5nQWxsb3dhbmNlOiAnJywgaW5jZW50aXZlczogW10gfSk7XG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbc2F2aW5nLCBzZXRTYXZpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWVzc2FnZSwgc2V0TWVzc2FnZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIFxuICAvLyBOZXcgUHJvZHVjdCBTdGF0ZVxuICBjb25zdCBbbmV3UHJvZHVjdCwgc2V0TmV3UHJvZHVjdF0gPSB1c2VTdGF0ZSh7IG5hbWU6ICcnLCB1bml0OiAnQmFncycsIHJhdGU6ICcnIH0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZmV0Y2hDb25maWcoKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGZldGNoQ29uZmlnID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBhcGkuZ2V0KCcvYWRtaW4vY29uZmlnJyk7XG4gICAgICAvLyBOb3JtYWxpemUgaW4gY2FzZSBiYWNrZW5kIHN0aWxsIGhhcyBvbGQgZGljdCBmb3JtYXQgKG1vY2sgZmFsbGJhY2spXG4gICAgICBsZXQgcGFyc2VkQ29uZmlnID0gcmVzLmRhdGE7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyc2VkQ29uZmlnLmluY2VudGl2ZXMpKSB7XG4gICAgICAgIHBhcnNlZENvbmZpZy5pbmNlbnRpdmVzID0gT2JqZWN0LmVudHJpZXMocGFyc2VkQ29uZmlnLmluY2VudGl2ZXMgfHwge30pLm1hcCgoW25hbWUsIHJhdGVdLCBpZHgpID0+ICh7XG4gICAgICAgICAgaWQ6IFN0cmluZyhpZHgrMSksIG5hbWUsIHVuaXQ6ICdVbml0cycsIHJhdGVcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgc2V0Q29uZmlnKHBhcnNlZENvbmZpZyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZmV0Y2ggYWRtaW4gY29uZmlnJywgZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBzZXRTYXZpbmcodHJ1ZSk7XG4gICAgc2V0TWVzc2FnZSgnJyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaS5wdXQoJy9hZG1pbi9jb25maWcnLCBjb25maWcpO1xuICAgICAgc2V0Q29uZmlnKHJlcy5kYXRhLmNvbmZpZyk7XG4gICAgICBzZXRNZXNzYWdlKCdDb25maWd1cmF0aW9uIHNhdmVkIHN1Y2Nlc3NmdWxseS4gR2xvYmFsbHkgYXBwbGllZC4nKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0TWVzc2FnZSgnJyksIDMwMDApO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0TWVzc2FnZSgnRXJyb3Igc2F2aW5nIGNvbmZpZ3VyYXRpb24uJyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFNhdmluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGFkZFByb2R1Y3QgPSAoKSA9PiB7XG4gICAgaWYgKCFuZXdQcm9kdWN0Lm5hbWUgfHwgIW5ld1Byb2R1Y3QucmF0ZSkgcmV0dXJuO1xuICAgIHNldENvbmZpZyhwcmV2ID0+ICh7XG4gICAgICAuLi5wcmV2LFxuICAgICAgaW5jZW50aXZlczogWy4uLnByZXYuaW5jZW50aXZlcywgeyAuLi5uZXdQcm9kdWN0LCBpZDogRGF0ZS5ub3coKS50b1N0cmluZygpLCByYXRlOiBwYXJzZUZsb2F0KG5ld1Byb2R1Y3QucmF0ZSkgfV1cbiAgICB9KSk7XG4gICAgc2V0TmV3UHJvZHVjdCh7IG5hbWU6ICcnLCB1bml0OiAnQmFncycsIHJhdGU6ICcnIH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlbW92ZVByb2R1Y3QgPSAoaWQpID0+IHtcbiAgICBzZXRDb25maWcocHJldiA9PiAoe1xuICAgICAgLi4ucHJldixcbiAgICAgIGluY2VudGl2ZXM6IHByZXYuaW5jZW50aXZlcy5maWx0ZXIocCA9PiBwLmlkICE9PSBpZClcbiAgICB9KSk7XG4gIH07XG5cbiAgaWYgKGxvYWRpbmcpIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cInB5LTggdGV4dC1jZW50ZXIgdGV4dC1ncmF5LTUwMFwiPkxvYWRpbmcgY29uZmlndXJhdGlvbnMuLi48L2Rpdj47XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNlwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBwLTYgcm91bmRlZC0yeGwgc2hhZG93LXNtIGJvcmRlciBib3JkZXItZ3JheS0xMDBcIj5cbiAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ib2xkIHRleHQtZ3JheS05MDAgbWItMlwiPlJhdGUgJiBBbGxvd2FuY2UgQ29uZmlndXJhdGlvbnM8L2gzPlxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS01MDAgbWItNlwiPlZhbHVlcyB1cGRhdGVkIGhlcmUgaW5zdGFudGx5IHJlZmxlY3QgYWNyb3NzIGFsbCBleGVjdXRpdmUgZGV2aWNlcyBmb3IgUCAmIEkgbWF0aC48L3A+XG5cbiAgICAgICAge21lc3NhZ2UgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgcC00IHJvdW5kZWQteGwgbWItNiB0ZXh0LXNtIGZvbnQtbWVkaXVtICR7bWVzc2FnZS5pbmNsdWRlcygnRXJyb3InKSA/ICdiZy1yZWQtNTAgdGV4dC1yZWQtNzAwJyA6ICdiZy1ncmVlbi01MCB0ZXh0LWdyZWVuLTcwMCd9YH0+XG4gICAgICAgICAgICB7bWVzc2FnZX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlU2F2ZX0gY2xhc3NOYW1lPVwic3BhY2UteS02XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmF5LTUwIHAtNCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItZ3JheS0yMDAgc3BhY2UteS00IG1heC13LWxnXCI+XG4gICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWdyYXktODAwIGJvcmRlci1iIGJvcmRlci1ncmF5LTIwMCBwYi0yXCI+UmVpbWJ1cnNlbWVudCBTZXR0aW5nczwvaDQ+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTFcIj5QZXItS00gUmVpbWJ1cnNlbWVudCBSYXRlICjigrkpPC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIiBcbiAgICAgICAgICAgICAgICBzdGVwPVwiMC4xXCJcbiAgICAgICAgICAgICAgICB2YWx1ZT17Y29uZmlnLmttUmF0ZX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldENvbmZpZyh7Li4uY29uZmlnLCBrbVJhdGU6IHBhcnNlRmxvYXQoZS50YXJnZXQudmFsdWUpIHx8IDB9KX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtNCBweS0yIGJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1sZyBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1ibHVlLTUwMFwiIFxuICAgICAgICAgICAgICAgIHJlcXVpcmVkIFxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTFcIj5EYWlseSBGb29kaW5nIEFsbG93YW5jZSAo4oK5KTwvbGFiZWw+XG4gICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCIgXG4gICAgICAgICAgICAgICAgc3RlcD1cIjFcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtjb25maWcuZm9vZGluZ0FsbG93YW5jZX1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldENvbmZpZyh7Li4uY29uZmlnLCBmb29kaW5nQWxsb3dhbmNlOiBwYXJzZUZsb2F0KGUudGFyZ2V0LnZhbHVlKSB8fCAwfSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiBib3JkZXIgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWQtbGcgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctYmx1ZS01MDBcIiBcbiAgICAgICAgICAgICAgICByZXF1aXJlZCBcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmF5LTUwIHAtNCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItZ3JheS0yMDAgc3BhY2UteS00XCI+XG4gICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWdyYXktODAwIGJvcmRlci1iIGJvcmRlci1ncmF5LTIwMCBwYi0yXCI+QWR2YW5jZWQgUHJvZHVjdCBJbmNlbnRpdmUgTWF0cml4PC9oND5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgey8qIER5bmFtaWMgUHJvZHVjdCBMaXN0ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAge2NvbmZpZy5pbmNlbnRpdmVzLm1hcCgocHJvZHVjdCkgPT4gKFxuICAgICAgICAgICAgICAgIDxkaXYga2V5PXtwcm9kdWN0LmlkfSBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCBiZy13aGl0ZSBwLTMgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWdyYXktMjAwXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+e3Byb2R1Y3QubmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktNTAwIGJnLWdyYXktMTAwIHB4LTIgcHktMSByb3VuZGVkXCI+e3Byb2R1Y3QudW5pdH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtZ3JlZW4tNjAwIHctMjQgdGV4dC1yaWdodFwiPuKCuXtwcm9kdWN0LnJhdGV9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsoKSA9PiByZW1vdmVQcm9kdWN0KHByb2R1Y3QuaWQpfSBjbGFzc05hbWU9XCJwLTEgdGV4dC1yZWQtNTAwIGhvdmVyOmJnLXJlZC01MCByb3VuZGVkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxTcXVhcmUgc2l6ZT17MTZ9IC8+IHsvKiBQbGFjZWhvbGRlciBmb3IgYSBkZWxldGUgaWNvbiAqL31cbiAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAge2NvbmZpZy5pbmNlbnRpdmVzLmxlbmd0aCA9PT0gMCAmJiA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS01MDBcIj5ObyBwcm9kdWN0cyBjb25maWd1cmVkLjwvcD59XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgey8qIEFkZCBOZXcgUHJvZHVjdCBGb3JtICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBwLTQgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWJsdWUtMTAwIG10LTQgc3BhY2UteS00XCI+XG4gICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdGV4dC1ibHVlLTgwMFwiPkFkZCBDdXN0b20gUHJvZHVjdDwvaDU+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMyBnYXAtNFwiPlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTFcIj5Qcm9kdWN0IE5hbWU8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9e25ld1Byb2R1Y3QubmFtZX0gb25DaGFuZ2U9e2UgPT4gc2V0TmV3UHJvZHVjdCh7Li4ubmV3UHJvZHVjdCwgbmFtZTogZS50YXJnZXQudmFsdWV9KX0gcGxhY2Vob2xkZXI9XCJlLmcuIFBhaW50XCIgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMS41IHRleHQtc20gYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnXCIgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+VW5pdCBUeXBlPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxzZWxlY3QgdmFsdWU9e25ld1Byb2R1Y3QudW5pdH0gb25DaGFuZ2U9e2UgPT4gc2V0TmV3UHJvZHVjdCh7Li4ubmV3UHJvZHVjdCwgdW5pdDogZS50YXJnZXQudmFsdWV9KX0gY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMS41IHRleHQtc20gYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnXCI+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJCYWdzXCI+QmFnczwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiS2dzXCI+S2dzPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJQY3NcIj5QY3M8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIk1UXCI+TVQ8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTFcIj5JbmNlbnRpdmUgUmF0ZSAo4oK5KTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiB2YWx1ZT17bmV3UHJvZHVjdC5yYXRlfSBvbkNoYW5nZT17ZSA9PiBzZXROZXdQcm9kdWN0KHsuLi5uZXdQcm9kdWN0LCByYXRlOiBlLnRhcmdldC52YWx1ZX0pfSBwbGFjZWhvbGRlcj1cIlJhdGVcIiBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtMyBweS0xLjUgdGV4dC1zbSBib3JkZXIgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWQtbGdcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXthZGRQcm9kdWN0fSBjbGFzc05hbWU9XCJiZy1ibHVlLTYwMCBob3ZlcjpiZy1ibHVlLTcwMCB0ZXh0LXdoaXRlIHB4LTQgcHktMS41IHJvdW5kZWQtbGcgdGV4dC1zbSBmb250LW1lZGl1bVwiPkFkZDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgdHlwZT1cInN1Ym1pdFwiIFxuICAgICAgICAgICAgZGlzYWJsZWQ9e3NhdmluZ31cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1sZyBiZy1ibHVlLTYwMCBob3ZlcjpiZy1ibHVlLTcwMCB0ZXh0LXdoaXRlIGZvbnQtbWVkaXVtIHB5LTMgcHgtNCByb3VuZGVkLXhsIHRyYW5zaXRpb24tY29sb3JzIG10LTJcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtzYXZpbmcgPyAnU2F2aW5nIENvbmZpZ3VyYXRpb25zLi4uJyA6ICdTYXZlIEdsb2JhbCBDb25maWd1cmF0aW9ucyd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5cbmZ1bmN0aW9uIFByb2ZpbGVTZXR0aW5ncyh7IHVzZXIsIG9uTG9nb3V0IH0pIHtcbiAgY29uc3QgW3Byb2ZpbGUsIHNldFByb2ZpbGVdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbc2F2aW5nLCBzZXRTYXZpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbbWVzc2FnZSwgc2V0TWVzc2FnZV0gPSB1c2VTdGF0ZSh7IHR5cGU6ICcnLCB0ZXh0OiAnJyB9KTtcbiAgXG4gIC8vIEZvcm0gZmllbGRzXG4gIGNvbnN0IFtmdWxsTmFtZSwgc2V0RnVsbE5hbWVdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbcGhvbmVOdW1iZXIsIHNldFBob25lTnVtYmVyXSA9IHVzZVN0YXRlKCcnKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGZldGNoUHJvZmlsZSgpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgZmV0Y2hQcm9maWxlID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBhcGkuZ2V0KCcvdXNlci9wcm9maWxlJyk7XG4gICAgICBzZXRQcm9maWxlKHJlcy5kYXRhKTtcbiAgICAgIHNldEZ1bGxOYW1lKHJlcy5kYXRhLmZ1bGxOYW1lIHx8ICcnKTtcbiAgICAgIHNldFBob25lTnVtYmVyKHJlcy5kYXRhLnBob25lTnVtYmVyIHx8ICcnKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBwcm9maWxlJywgZXJyKTtcbiAgICAgIHNldE1lc3NhZ2UoeyB0eXBlOiAnZXJyb3InLCB0ZXh0OiAnRmFpbGVkIHRvIGxvYWQgcHJvZmlsZSBkYXRhLicgfSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVVcGRhdGUgPSBhc3luYyAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBzZXRTYXZpbmcodHJ1ZSk7XG4gICAgc2V0TWVzc2FnZSh7IHR5cGU6ICcnLCB0ZXh0OiAnJyB9KTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXBpLnB1dCgnL3VzZXIvdXBkYXRlJywgeyBmdWxsTmFtZSwgcGhvbmVOdW1iZXIgfSk7XG4gICAgICBzZXRNZXNzYWdlKHsgdHlwZTogJ3N1Y2Nlc3MnLCB0ZXh0OiAnUHJvZmlsZSB1cGRhdGVkIHN1Y2Nlc3NmdWxseS4nIH0pO1xuICAgICAgXG4gICAgICAvLyBVcGRhdGUgbG9jYWwgcHJvZmlsZSBzdGF0ZSBhcyB3ZWxsXG4gICAgICBzZXRQcm9maWxlKHByZXYgPT4gKHsgLi4ucHJldiwgZnVsbE5hbWUsIHBob25lTnVtYmVyIH0pKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHNldE1lc3NhZ2UoeyB0eXBlOiAnZXJyb3InLCB0ZXh0OiBlcnIucmVzcG9uc2U/LmRhdGE/LmVycm9yIHx8ICdGYWlsZWQgdG8gdXBkYXRlIHByb2ZpbGUuJyB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U2F2aW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKGxvYWRpbmcpIHtcbiAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJweS04IHRleHQtY2VudGVyIHRleHQtZ3JheS01MDBcIj5Mb2FkaW5nIHByb2ZpbGUuLi48L2Rpdj47XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS02XCI+XG4gICAgICB7LyogVXNlciBJbmZvIENhcmQgKi99XG4gICAgICB7cHJvZmlsZSAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcC02IHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLWdyYXktMTAwIGZsZXggZmxleC1jb2wgbWQ6ZmxleC1yb3cgaXRlbXMtY2VudGVyIG1kOml0ZW1zLXN0YXJ0IGdhcC02XCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ibHVlLTEwMCB0ZXh0LWJsdWUtNjAwIHAtNiByb3VuZGVkLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgIDxVc2VyIHNpemU9ezQ4fSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIHRleHQtY2VudGVyIG1kOnRleHQtbGVmdFwiPlxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LWdyYXktOTAwXCI+e3Byb2ZpbGUuZnVsbE5hbWV9PC9oMj5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtZ3JheS01MDAgbWItNFwiPntwcm9maWxlLnJvbGV9IOKAoiB7cHJvZmlsZS5lbWFpbH08L3A+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNCB0ZXh0LWxlZnQgYm9yZGVyLXQgYm9yZGVyLWdyYXktMTAwIHB0LTRcIj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS00MDAgdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciBtYi0xXCI+RW1wbG95ZWUgSUQ8L3A+XG4gICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPntwcm9maWxlLmVtcGxveWVlSWQgfHwgJ04vQSd9PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS00MDAgdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciBtYi0xXCI+QXNzaWduZWQgTWFuYWdlcjwvcD5cbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+e3Byb2ZpbGUuYXNzaWduZWRTdXBlcnZpc29yfTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7LyogQWNjb3VudCBTZXR0aW5ncyBGb3JtICovfVxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBwLTYgcm91bmRlZC0yeGwgc2hhZG93LXNtIGJvcmRlciBib3JkZXItZ3JheS0xMDBcIj5cbiAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ib2xkIHRleHQtZ3JheS05MDAgbWItNlwiPkFjY291bnQgU2V0dGluZ3M8L2gzPlxuICAgICAgICBcbiAgICAgICAge21lc3NhZ2UudGV4dCAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BwLTQgcm91bmRlZC14bCBtYi02ICR7bWVzc2FnZS50eXBlID09PSAnc3VjY2VzcycgPyAnYmctZ3JlZW4tNTAgdGV4dC1ncmVlbi03MDAnIDogJ2JnLXJlZC01MCB0ZXh0LXJlZC03MDAnfWB9PlxuICAgICAgICAgICAge21lc3NhZ2UudGV4dH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17aGFuZGxlVXBkYXRlfSBjbGFzc05hbWU9XCJzcGFjZS15LTQgbWF4LXctbGdcIj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+RnVsbCBOYW1lPC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgdmFsdWU9e2Z1bGxOYW1lfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRGdWxsTmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOmJvcmRlci1ibHVlLTUwMFwiXG4gICAgICAgICAgICAgIHJlcXVpcmVkIFxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0xXCI+UGhvbmUgTnVtYmVyPC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgdmFsdWU9e3Bob25lTnVtYmVyfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRQaG9uZU51bWJlcihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOmJvcmRlci1ibHVlLTUwMFwiXG4gICAgICAgICAgICAgIHJlcXVpcmVkXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICB0eXBlPVwic3VibWl0XCIgXG4gICAgICAgICAgICBkaXNhYmxlZD17c2F2aW5nfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWJsdWUtNjAwIGhvdmVyOmJnLWJsdWUtNzAwIHRleHQtd2hpdGUgZm9udC1tZWRpdW0gcHktMyBweC00IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1jb2xvcnMgZGlzYWJsZWQ6b3BhY2l0eS03MCBtdC0yXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICB7c2F2aW5nID8gJ1NhdmluZyBDaGFuZ2VzLi4uJyA6ICdVcGRhdGUgRGV0YWlscyd9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgICAgXG4gICAgICB7LyogTG9nb3V0IEFjdGlvbiAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgcC02IHJvdW5kZWQtMnhsIHNoYWRvdy1zbSBib3JkZXIgYm9yZGVyLXJlZC0xMDAgbXQtOFwiPlxuICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJvbGQgdGV4dC1yZWQtNjAwIG1iLTJcIj5TZXNzaW9uIE1hbmFnZW1lbnQ8L2gzPlxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNTAwIHRleHQtc20gbWItNlwiPlNlY3VyZWx5IGxvZyBvdXQgb2YgeW91ciBmaWVsZCBleGVjdXRpdmUgcG9ydGFsLiBZb3Ugd2lsbCBuZWVkIHlvdXIgY3JlZGVudGlhbHMgdG8gYWNjZXNzIHlvdXIgZGFzaGJvYXJkIGFnYWluLjwvcD5cbiAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICBvbkNsaWNrPXtvbkxvZ291dH1cbiAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgc206dy1hdXRvIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIGJnLXJlZC01MCBob3ZlcjpiZy1yZWQtMTAwIHRleHQtcmVkLTcwMCBmb250LWJvbGQgcHktMyBweC02IHJvdW5kZWQteGwgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICA+XG4gICAgICAgICAgPExvZ091dCBzaXplPXsyMH0gLz5cbiAgICAgICAgICBTaWduIE91dCBOb3dcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdfQ==