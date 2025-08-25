// User History Component
const { useState, useEffect } = React;

function UserHistory({ isOpen, onClose, onSelectSearch }) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getSearchHistory();
            setHistory(response.history || []);
        } catch (error) {
            console.error('Error loading search history:', error);
            helpers.showToast('Error loading search history', 'danger');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSelect = (historyItem) => {
        const searchParams = {
            query: historyItem.query,
            cuisine: historyItem.cuisine_filter || '',
            meal_type: historyItem.meal_type_filter || '',
            diet: historyItem.dietary_filter || '',
            max_results: 12
        };
        onSelectSearch(searchParams);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-history me-2"></i>Search History
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        {isLoading ? (
                            <div className="loading">
                                <div className="spinner-border"></div>
                                <p>Loading search history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-4">
                                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                <h6>No Search History</h6>
                                <p className="text-muted">Start searching for recipes to see your history here.</p>
                            </div>
                        ) : (
                            <div>
                                <p className="mb-3">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Click on any search to repeat it
                                </p>
                                
                                {history.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="history-item slide-in"
                                        onClick={() => handleSearchSelect(item)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="history-query">
                                            <i className="fas fa-search me-2"></i>
                                            {item.query || 'Browse recipes'}
                                        </div>
                                        
                                        <div className="history-filters">
                                            {item.cuisine_filter && (
                                                <span className="history-filter">
                                                    <i className="fas fa-globe me-1"></i>
                                                    {item.cuisine_filter}
                                                </span>
                                            )}
                                            {item.meal_type_filter && (
                                                <span className="history-filter">
                                                    <i className="fas fa-utensils me-1"></i>
                                                    {helpers.capitalize(item.meal_type_filter)}
                                                </span>
                                            )}
                                            {item.dietary_filter && (
                                                <span className="history-filter">
                                                    <i className="fas fa-leaf me-1"></i>
                                                    {helpers.capitalize(item.dietary_filter)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="history-date">
                                            {helpers.formatDateTime(item.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
