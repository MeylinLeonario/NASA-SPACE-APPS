"""Independent output models; all preprocessing fitted within each training fold."""
import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, ConstantKernel, WhiteKernel
from sklearn.ensemble import HistGradientBoostingRegressor

class Unavailable(ValueError):
    pass

def fit_model(name, x, y, uncertainty=None):
    if name == 'physics_gpr':
        raise Unavailable('No documented regime-specific physical baseline is supplied. Physics-guided GPR is disabled.')
    if name == 'boosting':
        return make_pipeline(StandardScaler(), HistGradientBoostingRegressor(min_samples_leaf=2, max_iter=100, random_state=0)).fit(x, y)
    if name != 'gpr':
        raise Unavailable('Unknown model')
    # Normalize explicitly so measurement variance is expressed in normalized target units.
    scale = float(np.std(y)) or 1.0
    alpha = np.array([(s or 0.0)**2 / scale**2 for s in uncertainty]) if uncertainty else 1e-8
    kernel = ConstantKernel(1.0) * Matern(length_scale=np.ones(len(x[0])), nu=1.5) + WhiteKernel(1e-3)
    return make_pipeline(StandardScaler(), GaussianProcessRegressor(kernel=kernel, alpha=alpha + 1e-8,
                         normalize_y=True, random_state=0)).fit(x, y)

def predict(model, x, name):
    if name == 'gpr':
        mean, std = model.predict(x, return_std=True)
        return mean, np.column_stack((mean - 1.96 * std, mean + 1.96 * std))
    return model.predict(x), None
