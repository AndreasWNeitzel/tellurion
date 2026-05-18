# Neutron Stars: the TOV Equation and the Mass-Radius Diagram

A neutron star is the densest stable matter in the universe, and its structure is a balance between gravity and degeneracy pressure in curved spacetime. The Tolman-Oppenheimer-Volkoff equation is the general-relativistic version of hydrostatic equilibrium; to solve it you must choose an equation of state, the relation between pressure and density of ultra-dense matter, which is still not known from first principles. This playground integrates the TOV equation for four equations of state and traces the mass-radius diagram, the single most important plot in neutron-star physics.

What to look for: the free-neutron Fermi gas, the simplest possible model with no free parameters, peaks at just 0.71 solar masses, the historic Oppenheimer-Volkoff result from 1939 that first showed a maximum mass exists. Every mass-radius curve turns over: stars past the peak are unstable. Two pulsars have been weighed at about two solar masses, so the dashed line is an observational guillotine, any equation of state whose maximum falls below it is ruled out. Switch between the equations of state and watch the soft polytrope and the Fermi gas fail that test while the stiff one survives, and see the self-bound quark star with its tiny radius and sharp surface.

Controls: the equation-of-state selector switches between the free Fermi gas, a stiff and a soft polytrope and MIT-bag quark matter; the central-density slider moves the star along its mass-radius curve, through the maximum-mass turning point. Reset restores the Fermi gas; Pause freezes the marker pulse, which is decoration only.

## Reference

Primary citation: Tolman 1939; Oppenheimer and Volkoff 1939 (Phys. Rev. 55, 374); Shapiro and Teukolsky, Black Holes, White Dwarfs and Neutron Stars, Ch. 5.

## Verification

- Strong invariant: the free-Fermi-gas maximum mass is 0.71 M_sun within 5 percent (Oppenheimer-Volkoff); soft maximum mass < stiff.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
