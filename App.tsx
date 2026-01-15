{stage === 'results' ? (
  <div className="h-full relative animate-in fade-in slide-in-from-right-10 duration-700">
    {mode === 'essentials' && (
      <EssentialsDashboard 
        city={locationContext.city} 
        area={locationContext.area} 
      />
    )}
    
    {buyData && mode === 'buy' && (
      <BuyDashboard 
        result={buyData} 
        lang={lang} 
        userBudget={userBudget} 
        onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
        city={locationContext.city}
        area={locationContext.area}
      />
    )}
    
    {rentData && mode === 'rent' && (
      <RentDashboard 
        result={rentData} 
        lang={lang} 
        userBudget={userBudget} 
        onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
        city={locationContext.city}
        area={locationContext.area}
      />
    )}
    
    {landData && mode === 'land' && (
      <LandReport 
        result={landData} 
        lang={lang} 
        onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
        city={locationContext.city}
        area={locationContext.area}
      />
    )}
    
    {commercialData && mode === 'commercial' && (
      <CommercialDashboard 
        result={commercialData} 
        lang={lang} 
        onAnalyzeFinance={() => { setFinanceTab('calc'); setShowFinance(true); }}
        city={locationContext.city}
        area={locationContext.area}
        pincode={locationContext.pincode}
        initialType={commercialMeta.type}
        initialSqft={commercialMeta.sqft}
      />
    )}

    {/* Finance Modal - same as before */}
    {showFinance && (
      // ... existing finance modal code ...
    )}
  </div>
) : (
  // ... existing awaiting signal UI ...
)}
