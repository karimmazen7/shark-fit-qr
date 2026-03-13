import { useMemo, useState } from "react";
import { supabase } from "./supabase";
import sharkLogo from "./assets/sharkLogo.png";
import backgroundGym from "./assets/backgroundGym.png";
import en from "./locales/en";
import ar from "./locales/ar";
import "./App.css";

function InstagramIcon() {
  return (
    <svg
      className="infoIcon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      className="infoIcon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="infoIcon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.6-1.4a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7A2 2 0 0 1 22 16.9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedPhone, setSavedPhone] = useState("");
  const [step, setStep] = useState("form");
  const [wonOfferKey, setWonOfferKey] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lang, setLang] = useState("en");

  const dict = lang === "ar" ? ar : en;

  // ===== TEST MODE =====
  const MAIN_SPIN_LIMIT = 100; // first 10 completed winners
  const FREE_MONTH_LIMIT = 5; // only 2 free winners
  const TOTAL_SPIN_LIMIT = 999999; // keep open for testing after 10

  const normalOfferKeys = ["cash100", "cash150", "cash200"];
  const freeMonthKey = "freeMonth";
  const afterLimitKey = "cash50";
  const wheelOfferKeys = [...normalOfferKeys, freeMonthKey];

  const instagramUrl =
    "https://www.instagram.com/sharkfit_fitnessclub?igsh=MXVrcTk5NGtweTZwYg%3D%3D";
  const locationUrl =
    "https://www.google.com/maps/place/Shark+Fit+Gym/@29.8445423,31.3292541,17z/data=!3m1!4b1!4m6!3m5!1s0x145837002c223e77:0xf7c35a34d13a641a!8m2!3d29.8445423!4d31.3292541!16s%2Fg%2F11mdsyjhwz?entry=ttu&g_ep=EgoyMDI2MDMwOS4wIKXMDSoASAFQAw%3D%3D";
  const gymPhone = "01060106402";

  const wonOffer = useMemo(() => {
    if (!wonOfferKey) return null;
    return dict.offers[wonOfferKey];
  }, [wonOfferKey, dict]);

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
      alert(dict.enterPhone);
      return;
    }

    if (!isValidLocalEgyptPhone(phone)) {
      alert(dict.invalidPhone);
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
        alert(dict.usedOffer);
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
      console.error("handleSubmit error:", error);
      alert(dict.somethingWrong);
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (isSpinning) return;
    if (!savedPhone) {
      alert(dict.somethingWrong);
      return;
    }

    setIsSpinning(true);

    try {
      // total completed winners
      const { count: totalSpins, error: totalError } = await supabase
        .from("shark_fit_leads")
        .select("id", { count: "exact", head: true })
        .not("discount", "is", null);

      if (totalError) throw totalError;

      console.log("total completed spins:", totalSpins);

      // total free month winners
      const { count: freeMonthWinnersCount, error: freeCountError } =
        await supabase
          .from("shark_fit_leads")
          .select("id", { count: "exact", head: true })
          .eq("discount", "1 MONTH FREE");

      if (freeCountError) throw freeCountError;

      console.log("free month winners count:", freeMonthWinnersCount);

      const completedSpins = totalSpins ?? 0;
      const freeCount = freeMonthWinnersCount ?? 0;

      let selectedOfferKey = null;
      let selectedIndex = 0;

      // ===== first 10 winners =====
      if (completedSpins < MAIN_SPIN_LIMIT) {
        const spinsLeftIncludingCurrent = MAIN_SPIN_LIMIT - completedSpins;
        const freeLeftIncludingCurrent = FREE_MONTH_LIMIT - freeCount;

        // If remaining spins == remaining free prizes, we MUST give free month now
        if (
          freeLeftIncludingCurrent > 0 &&
          spinsLeftIncludingCurrent === freeLeftIncludingCurrent
        ) {
          selectedOfferKey = freeMonthKey;
        } else if (freeLeftIncludingCurrent > 0) {
          // Controlled probability so we end with exactly 2 free winners by spin 10
          const shouldGiveFree =
            Math.random() <
            freeLeftIncludingCurrent / spinsLeftIncludingCurrent;

          if (shouldGiveFree) {
            selectedOfferKey = freeMonthKey;
          } else {
            const randomIndex = Math.floor(
              Math.random() * normalOfferKeys.length,
            );
            selectedOfferKey = normalOfferKeys[randomIndex];
          }
        } else {
          // Free month quota finished
          const randomIndex = Math.floor(
            Math.random() * normalOfferKeys.length,
          );
          selectedOfferKey = normalOfferKeys[randomIndex];
        }

        if (selectedOfferKey === "cash100") selectedIndex = 0;
        if (selectedOfferKey === "cash150") selectedIndex = 1;
        if (selectedOfferKey === "cash200") selectedIndex = 2;
        if (selectedOfferKey === "freeMonth") selectedIndex = 3;
      } else {
        // ===== after first 10 winners =====
        selectedOfferKey = afterLimitKey;
        selectedIndex = 0;
      }

      console.log("selectedOfferKey:", selectedOfferKey);

      const segmentAngle = 360 / 4;
      const targetAngle = selectedIndex * segmentAngle;
      const extraSpins = 5 * 360;
      const finalRotation = rotation + extraSpins + (360 - targetAngle);

      setRotation(finalRotation);

      setTimeout(async () => {
        try {
          const currentOfferDict = lang === "ar" ? ar : en;
          const selectedOffer = currentOfferDict.offers[selectedOfferKey];

          console.log("selectedOffer:", selectedOffer);
          console.log("savedPhone:", savedPhone);

          const { data: updatedRows, error: updateError } = await supabase
            .from("shark_fit_leads")
            .update({ discount: selectedOffer.discountValue })
            .eq("phone_number", savedPhone)
            .select();

          if (updateError) {
            console.error("update error:", updateError);
            alert(dict.somethingWrong);
            setIsSpinning(false);
            return;
          }

          console.log("updated rows:", updatedRows);

          setWonOfferKey(selectedOfferKey);
          setStep("result");
          setIsSpinning(false);
        } catch (error) {
          console.error("spin timeout update error:", error);
          alert(dict.somethingWrong);
          setIsSpinning(false);
        }
      }, 4000);
    } catch (error) {
      console.error("spinWheel error:", error);
      alert(dict.spinFailed);
      setIsSpinning(false);
    }
  };

  return (
    <div
      className="page"
      dir="ltr"
      style={{ backgroundImage: `url(${backgroundGym})` }}
    >
      <div className="overlay"></div>

      <div className="contentWrap">
        <div className="card">
          <div className="topBar">
            <div className="languageSwitch">
              <button
                type="button"
                className={`langBtn ${lang === "en" ? "active" : ""}`}
                onClick={() => setLang("en")}
              >
                {dict.langEn}
              </button>
              <button
                type="button"
                className={`langBtn ${lang === "ar" ? "active" : ""}`}
                onClick={() => setLang("ar")}
              >
                {dict.langAr}
              </button>
            </div>
          </div>

          <div className="logoWrap">
            <img src={sharkLogo} alt="Shark Fit Logo" className="logo" />
          </div>

          {step === "form" && (
            <>
              <div className="badge">{dict.badge}</div>

              <h1>{dict.formTitle}</h1>
              <p className="subtitle">{dict.formSubtitle}</p>

              <form onSubmit={handleSubmit} className="form">
                <div className="phoneField">
                  <div className="phonePrefix">+20</div>
                  <input
                    type="tel"
                    placeholder={dict.phonePlaceholder}
                    value={phone}
                    onChange={handlePhoneChange}
                    className="input phoneInput"
                    maxLength={10}
                  />
                </div>

                <button type="submit" className="button" disabled={loading}>
                  {loading ? dict.checking : dict.continueToSpin}
                </button>
              </form>

              <div className="gymInfo">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="infoBtn"
                >
                  <InstagramIcon />
                  <span>{dict.instagram}</span>
                </a>

                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="infoBtn"
                >
                  <LocationIcon />
                  <span>{dict.location}</span>
                </a>

                <a href={`tel:${gymPhone}`} className="infoBtn">
                  <PhoneIcon />
                  <span>{gymPhone}</span>
                </a>
              </div>
            </>
          )}

          {step === "wheel" && (
            <div className="wheelSection">
              <div className="badge">{dict.badge}</div>
              <h1>{dict.wheelTitle}</h1>
              <p className="subtitle">{dict.wheelSubtitle}</p>

              <div className="wheelWrap">
                <div className="pointer"></div>

                <div
                  className={`wheel ${isSpinning ? "spinning" : ""}`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="slice slice1">
                    <span>{dict.offers.cash100.wheelLabel}</span>
                  </div>
                  <div className="slice slice2">
                    <span>{dict.offers.cash150.wheelLabel}</span>
                  </div>
                  <div className="slice slice3">
                    <span>{dict.offers.cash200.wheelLabel}</span>
                  </div>
                  <div className="slice slice4">
                    <span>{dict.offers.freeMonth.wheelLabel}</span>
                  </div>
                </div>
              </div>

              <button
                className="button spinBtn"
                onClick={spinWheel}
                disabled={isSpinning}
              >
                {isSpinning ? dict.spinning : dict.spinNow}
              </button>

              <div className="gymInfo">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="infoBtn"
                >
                  <InstagramIcon />
                  <span>{dict.instagram}</span>
                </a>

                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="infoBtn"
                >
                  <LocationIcon />
                  <span>{dict.location}</span>
                </a>

                <a href={`tel:${gymPhone}`} className="infoBtn">
                  <PhoneIcon />
                  <span>{gymPhone}</span>
                </a>
              </div>
            </div>
          )}

          {step === "result" && wonOffer && (
            <div className="offerCard">
              <div className="offerBadge">{dict.youWon}</div>
              <h2>{wonOffer.resultTitle}</h2>
              <p className="offerText">{wonOffer.resultText}</p>

              <div className="offerPhoneBox">
                <span className="offerLabel">{dict.phoneNumber}</span>
                <strong>+{savedPhone}</strong>
              </div>

              <div className="offerNote">{dict.showScreen}</div>

              <div className="gymInfo resultInfo">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="infoBtn"
                >
                  <InstagramIcon />
                  <span>{dict.instagram}</span>
                </a>

                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="infoBtn"
                >
                  <LocationIcon />
                  <span>{dict.location}</span>
                </a>

                <a href={`tel:${gymPhone}`} className="infoBtn">
                  <PhoneIcon />
                  <span>{gymPhone}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
