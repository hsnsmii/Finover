// styles.js
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
 
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    
    // Header Styles
    header: {
      paddingTop: 10,
      paddingHorizontal: 16,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: "hidden",
      elevation: 5,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    menuButton: {
      padding: 5,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "white",
    },
    profileCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "white",
      alignItems: "center",
      justifyContent: "center",
    },
    
    // Market Overview Styles
    marketOverview: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
    },
    marketCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      width: "48%",
    },
    marketCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    marketCardTitle: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    marketCardValue: {
      color: "white",
      fontSize: 24,
      fontWeight: "700",
      marginTop: 4,
    },
    marketCardTrend: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    trendUp: {
      color: "#4CAF50",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 2,
    },
    trendDown: {
      color: "#E53935",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 2,
    },
    
    // Section Styles
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#2c3e50",
    },
    seeAllText: {
      color: "#3498db",
      fontSize: 14,
      fontWeight: "500",
    },
    
    // Preferred Stocks Styles
    preferredStocksScroll: {
      marginLeft: -5,
    },
    stockCard: {
      backgroundColor: "white",
      borderRadius: 12,
      padding: 14,
      marginRight: 12,
      width: 160,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    stockCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    stockSymbol: {
      fontSize: 16,
      fontWeight: "700",
      color: "#2c3e50",
    },
    stockName: {
      fontSize: 12,
      color: "#7f8c8d",
      marginTop: 4,
      marginBottom: 8,
    },
    stockPriceContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
    },
    stockPrice: {
      fontSize: 16,
      fontWeight: "700",
      color: "#2c3e50",
    },
    percentChange: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    percentUp: {
      backgroundColor: "#4CAF50",
    },
    percentDown: {
      backgroundColor: "#E53935",
    },
    percentText: {
      color: "white",
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 2,
    },
    refreshButton: {
      flexDirection: "row",
      backgroundColor: "#3498db",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 16,
    },
    refreshIcon: {
      marginRight: 6,
    },
    refreshText: {
      color: "white",
      fontWeight: "600",
      fontSize: 14,
    },
    
    // Watchlist Styles
    watchlistGrid: {
      marginTop: 6,
    },
    watchlistCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "white",
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    watchlistIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#ecf0f1",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    watchlistInfo: {
      flex: 1,
    },
    watchlistName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#2c3e50",
    },
    watchlistCount: {
      fontSize: 13,
      color: "#7f8c8d",
      marginTop: 2,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#3498db",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    addText: {
      color: "white",
      fontWeight: "600",
      fontSize: 12,
      marginLeft: 2,
    },
    
    // Footer Styles
    footer: {
      flexDirection: "row",
      backgroundColor: "white",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: "#ecf0f1",
      alignItems: "center",
      justifyContent: "space-around",
    },
    footerTab: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    footerMainButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "#3498db",
      alignItems: "center",
      justifyContent: "center",
      marginTop: -20,
      shadowColor: "#3498db",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    footerText: {
      fontSize: 12,
      marginTop: 3,
      color: "#95a5a6",
    },
    activeTab: {
      color: "#3498db",
      fontWeight: "600",
    },

    //yeni liste
    // styles/hstyles.js içine ekle:
modalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',  // arka planı karartır
  justifyContent: 'center',            // dikey ortalama
  alignItems: 'center',                // yatay ortalama
},

modalContent: {
  backgroundColor: 'white',
  width: '80%',
  padding: 20,
  borderRadius: 10,
  elevation: 5, // Android için gölge
  shadowColor: '#000', // iOS için gölge
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},

modalInput: {
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 6,
  padding: 10,
  marginVertical: 10,
},

modalActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},

  
});

export default styles;
