// Re-export from the new modular hooks for backward compatibility
export {
  useAllCirclesMulticall as useGetCircles,
  useUserCircles as useGetUserCircles,
  useCircleDetails as useGetCircleDetails,
  type FormattedCircle as CircleData
} from './useCircleQueries';