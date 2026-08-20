# -*- coding: utf-8 -*-
"""
Functions to transfer coordinates under different coordinate system
"""
# Author: Runsheng Xu <rxx3386@ucla.edu>
# License: TDG-Attribution-NonCommercial-NoDistrib
import numpy as np


def geo_to_transform(lat, lon, alt, lat_0, lon_0, alt_0):
    """
    Convert WG84 to ENU. The origin of the ENU should pass the geo reference.
    Note this function is a writen by reversing the
    official API transform_to_geo.

    Parameters
    ----------
    lat : float
        current latitude.

    lon : float
        current longitude.

    alt : float
        current altitude.

    lat_0 : float)
        geo_ref latitude.

    lon_0 : float
        geo_ref longitude.

    alt_0 : float
        geo_ref altitude.

    Returns
    -------
    x : float
        The transformed x coordinate.

    y : float
        The transformed y coordinate.

    z : float
        The transformed z coordinate.
    """
    EARTH_RADIUS_EQUA = 6378137.0
    scale = np.cos(np.deg2rad(lat_0))

    mx = lon * np.pi * EARTH_RADIUS_EQUA * scale / 180
    mx_0 = scale * np.deg2rad(lon_0) * EARTH_RADIUS_EQUA
    x = mx - mx_0

    my = np.log(np.tan((lat + 90) * np.pi / 360)) * EARTH_RADIUS_EQUA * scale
    my_0 = scale * EARTH_RADIUS_EQUA * \
        np.log(np.tan((90 + lat_0) * np.pi / 360))
    y = -(my - my_0)

    z = alt - alt_0

    return x, y, z


def geo_noise_to_meters(lat_stddev, lon_stddev, alt_stddev, lat_0, lon_0):
    """
    Convert GNSS noise given in WGS84 degrees (lat/lon stddev) and meters
    (alt stddev) into an approximate x/y/z stddev in the local ENU frame
    geo_to_transform produces.

    geo_to_transform's y-axis uses a Mercator (log-tangent) projection,
    not a plain linear scale — unlike x, its degrees-to-meters ratio has
    no simple closed form here. Rather than hand-deriving and risking a
    sign or scale error in that derivative, this estimates both axes
    the same way: a numerical (finite-difference) local Jacobian at
    (lat_0, lon_0), i.e. how many meters one step of EPS degrees maps to
    at this reference point. That's an approximation valid near the
    reference — fine for a scenario confined to one city/map, which is
    the only case this is ever used for — not a global-accuracy formula.

    Parameters
    ----------
    lat_stddev : float
        GNSS latitude noise stddev, in degrees.
    lon_stddev : float
        GNSS longitude noise stddev, in degrees.
    alt_stddev : float
        GNSS altitude noise stddev, in meters (already linear, no
        conversion needed — returned as-is).
    lat_0 : float
        Reference latitude (the map's geo reference).
    lon_0 : float
        Reference longitude (the map's geo reference).

    Returns
    -------
    x_stddev, y_stddev, z_stddev : float
        Approximate 1-sigma position noise in meters, in the same x/y/z
        frame geo_to_transform returns.
    """
    eps = 1e-6  # degrees; ~0.1m of ground displacement, small enough to
    # stay in the locally-linear regime without hitting float precision
    # limits on the log/tan terms.

    x0, y0, _ = geo_to_transform(lat_0, lon_0, 0.0, lat_0, lon_0, 0.0)
    x_dlat, y_dlat, _ = geo_to_transform(
        lat_0 + eps, lon_0, 0.0, lat_0, lon_0, 0.0)
    x_dlon, y_dlon, _ = geo_to_transform(
        lat_0, lon_0 + eps, 0.0, lat_0, lon_0, 0.0)

    # Local Jacobian: meters of x/y change per degree of lat/lon change.
    dx_dlat = (x_dlat - x0) / eps
    dy_dlat = (y_dlat - y0) / eps
    dx_dlon = (x_dlon - x0) / eps
    dy_dlon = (y_dlon - y0) / eps

    # Propagate independent lat/lon noise through the (locally linear)
    # transform: variance adds in quadrature across the two sources for
    # each output axis.
    x_stddev = float(np.hypot(dx_dlat * lat_stddev, dx_dlon * lon_stddev))
    y_stddev = float(np.hypot(dy_dlat * lat_stddev, dy_dlon * lon_stddev))

    return x_stddev, y_stddev, float(alt_stddev)