import { StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', 
    paddingTop: Platform.OS === 'ios' ? STATUSBAR_HEIGHT : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', 
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937', 
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF', 
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  stockInfo: {
    flex: 1,
    marginRight: 12,
  },
  symbol: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1F2937', 
    marginBottom: 4,
  },
  name: {
    color: '#6B7280', 
    fontSize: 14,
    maxWidth: width * 0.6,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  change: {
    fontSize: 14,
  },
  priceUp: {
    color: '#10B981', 
  },
  priceDown: {
    color: '#EF4444', 
  },
  priceNeutral: {
    color: '#1F2937', 
  },
  separator: {
    height: 1,
    backgroundColor: 'transparent',
  },
});

export default styles;
