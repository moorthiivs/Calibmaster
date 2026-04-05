import "./LoginCard.css";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/auth-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import logo from "../../images/CalibMaster_Logo2.png";
import { Buffer } from "buffer";
import { useDispatch } from "react-redux";
import { isloadingActions } from "../../store/isloadingslice";
import { apiloginHandler, apipostHandler } from "../../utils/api";
import { notification } from "antd";

const LoginCard = (props) => {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState();
  const auth = useContext(AuthContext);
  const [isError, setIsError] = useState(false);
  const [isSubmited, setIsSubmited] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const dispatch = useDispatch();

  const emailHandler = (e) => {
    const { value } = e.target;
    setEmail({ value: value, error: '' });
    setError();
    setEmailErr("");
    setIsError(false);
  };

  const passwordHandler = (e) => {
    const { value } = e.target;
    setPassword({ value: value, error: '' });
    setError();
    setPasswordErr("");
    setIsError(false);
  };

  const validatePassword = (password) => {
    // Check if password is at least 8 characters and contains at least one uppercase, one lowercase, and one digit
    const isLengthValid = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return isLengthValid && hasUppercase && hasLowercase && hasNumber;
  };

  const loginHandler = async () => {
    try {
      setIsSubmited(true);
      dispatch(isloadingActions.changeisloading(true));

      if (!email.value) {
        setEmailErr("Please enter your email address");
        dispatch(isloadingActions.changeisloading(false));
        return;
      }

      if (!password.value) {
        setPasswordErr("Please enter your password");
        dispatch(isloadingActions.changeisloading(false));
        return;
      }

      const requestBody = {
        email: email.value,
        password: password.value,
      };

      const { data, error } = await apiloginHandler("/api/users/login", requestBody);

      //dispatch(isloadingActions.changeisloading(false));

      if (data) {
        if (data.code === 200) {
          const data1 = data.data;
          if (data1.email != "root@iviewsense.com") {
            const prefix = "data:" + data1.imgtype + ";base64,";
            const base64data = new Buffer(data.data.image).toString("base64");
            // localStorage.setItem("logo", prefix + base64data);
            localStorage.setItem("logo", data.data.filename);
          }

          // Track Login FIRST
          const trackRes = await apipostHandler("/api/employee-track/login", { userId: data1.userId }, data1.token);

          if (trackRes.data && trackRes.data.status === "ERROR") {
            notification.error({
              message: "Concurrent Login Detected",
              description: trackRes.data.message,
              placement: "topRight"
            });
            setError(trackRes.data.message);
            return;
          }

          auth.login(
            data1.userId,
            data1.token,
            data1.name,
            data1.email,
            data1.department,
            data1.labId
          );

          setError();
          props.redirect(true);
        } else {
          setError(data.message);
        }
      } else {
        setError(error);
        dispatch(isloadingActions.changeisloading(false));
      }
    } catch (error) {
      console.log(error);

    } finally {
      dispatch(isloadingActions.changeisloading(false));
      setIsSubmited(false);
    }

  };

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        loginHandler();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [email, password]);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/60 p-8 sm:p-12 transform transition-all relative overflow-hidden group">
        {/* Subtle glass glare */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/80 to-transparent pointer-events-none opacity-50"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo container with pulse ring effect */}
          <div className="relative mb-8 group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-28 h-28 bg-white rounded-full shadow-xl shadow-blue-900/10 flex items-center justify-center p-3 border border-slate-100/50 overflow-hidden">
              <img src={logo} alt="CalibMaster Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </div>

          <div className="w-full space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 ml-1 uppercase tracking-widest opacity-80">Email Account</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-white/70 block px-4 py-3.5 border border-slate-200/60 text-slate-800 text-sm font-semibold rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none placeholder-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  value={email.value}
                  onChange={emailHandler}
                />
              </div>
              {emailErr && <p className="mt-2 text-xs text-red-500 font-bold ml-1 animate-pulse">{emailErr}</p>}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 ml-1 uppercase tracking-widest opacity-80">Secure Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full bg-white/70 block px-4 py-3.5 pr-12 border border-slate-200/60 text-slate-800 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none placeholder-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] tracking-widest"
                  value={password.value}
                  onChange={passwordHandler}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
              {passwordErr && <p className="mt-2 text-xs text-red-500 font-bold ml-1 animate-pulse">{passwordErr}</p>}
            </div>

            <div className="pt-4">
              <button
                onClick={loginHandler}
                disabled={isSubmited}
                className="w-full relative overflow-hidden text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-bold rounded-2xl text-sm px-5 py-4 text-center shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)] hover:shadow-[0_15px_30px_-15px_rgba(37,99,235,0.9)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 tracking-widest uppercase items-center"
              >
                <span className="relative z-10">Access Dashboard</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full p-4 mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl shadow-lg shadow-orange-500/20 text-left animate-[fadeIn_0.3s_ease-in-out]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5 shadow-inner border border-orange-200">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h3 className="text-orange-800 font-extrabold text-xs uppercase tracking-widest mb-1.5 drop-shadow-sm">Authentication Notice</h3>
                  <p className="text-orange-700 text-sm font-semibold tracking-tight leading-snug m-0">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-slate-800/60 text-xs font-semibold tracking-widest select-none bg-white/40 px-4 py-2 rounded-full backdrop-blur-md">
        SECURED BY IVIEWSENSE ENTERPRISE
      </div>
    </div>
  );
};

export default LoginCard;
