import { useState } from "react";
import { supabase } from "./supabase";
import sharkLogo from "./assets/sharkLogo.png";
import backgroundGym from "./assets/backgroundGym.png";
import "./App.css";

export default function App() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedPhone, setSavedPhone] = useState("");
  const [step, setStep] = useState("form"); // form | wheel | result
  const [discount, setDiscount] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const discounts = [20, 30, 40, 50];

  const normalizeLocalEgyptPhone = (value) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const isValidLocalEgyptPhone = (value) => {
    return /^(10|11|12|15)\d{8}$/.test(value);
  };

  const handlePhoneChange = (e) => {
    const cleanValue = normalizeLocalEgyptPhone(e.target.value);
    setPhone(cleanValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!isValidLocalEgyptPhone(phone)) {
      alert("Please enter a valid Egyptian mobile number.");
      return;
    }

    const fullPhone = `20${phone}`;

    try {
      setLoading(true);

      const { data: existing, error: selectError } = await supabase
        .from("shark_fit_leads")
        .select("id")
        .eq("phone_number", fullPhone)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        alert("This phone number already used the offer.");
        return;
      }

      const { error: insertError } = await supabase
        .from("shark_fit_leads")
        .insert([{ phone_number: fullPhone }]);

      if (insertError) throw insertError;

      setSavedPhone(fullPhone);
      setStep("wheel");
      setPhone("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    const randomIndex = Math.floor(Math.random() * discounts.length);
    const result = discounts[randomIndex];

    const segmentAngle = 360 / discounts.length;
    const targetAngle = randomIndex * segmentAngle;
    const extraSpins = 5 * 360;
    const finalRotation = rotation + extraSpins + (360 - targetAngle);

    setRotation(finalRotation);

    setTimeout(() => {
      setDiscount(result);
      setStep("result");
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="page" style={{ backgroundImage: `url(${backgroundGym})` }}>
      <div className="overlay"></div>

      <div className="contentWrap">
        <div className="card">
          <div className="logoWrap">
            <img src={sharkLogo} alt="Shark Fit Logo" className="logo" />
          </div>

          {step === "form" && (
            <>
              <div className="badge">SHARK FIT</div>

              <h1>Spin & Win Discount</h1>
              <p className="subtitle">
                Enter your phone number to spin the wheel and win a special
                Shark Fit Gym discount.
              </p>

              <form onSubmit={handleSubmit} className="form">
                <div className="phoneField">
                  <div className="phonePrefix">+20</div>
                  <input
                    type="tel"
                    placeholder="1012345678"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="input phoneInput"
                    maxLength={10}
                  />
                </div>

                <button type="submit" className="button" disabled={loading}>
                  {loading ? "Checking..." : "Continue to Spin"}
                </button>
              </form>
            </>
          )}

          {step === "wheel" && (
            <div className="wheelSection">
              <div className="badge">SHARK FIT</div>
              <h1>Spin the Wheel</h1>
              <p className="subtitle">
                Tap the button and discover your 1-month membership discount.
              </p>

              <div className="wheelWrap">
                <div className="pointer"></div>

                <div
                  className={`wheel ${isSpinning ? "spinning" : ""}`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="slice slice1">
                    <span>20% OFF</span>
                  </div>
                  <div className="slice slice2">
                    <span>30% OFF</span>
                  </div>
                  <div className="slice slice3">
                    <span>40% OFF</span>
                  </div>
                  <div className="slice slice4">
                    <span>50% OFF</span>
                  </div>
                </div>
              </div>

              <button
                className="button spinBtn"
                onClick={spinWheel}
                disabled={isSpinning}
              >
                {isSpinning ? "Spinning..." : "SPIN NOW"}
              </button>
            </div>
          )}

          {step === "result" && (
            <div className="offerCard">
              <div className="offerBadge">YOU WON</div>
              <h2>{discount}% OFF</h2>
              <p className="offerText">Shark Fit Gym Membership for 1 Month</p>

              <div className="offerPhoneBox">
                <span className="offerLabel">Phone Number</span>
                <strong>+{savedPhone}</strong>
              </div>

              <div className="offerNote">
                Show this screen at Shark Fit Gym reception to claim your
                discount.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
