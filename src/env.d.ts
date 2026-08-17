/// <reference types="astro/client" />

/**
 * The preloader gate.
 *
 * Created by an `is:inline` script in `Layout.astro` — i.e. before any bundled
 * module runs — so neither the preloader controller nor the `client:load`
 * Experience island can start before the other has had a chance to subscribe.
 */
interface Window {
  __mosPreloader?: {
    promise: Promise<void>;
    resolve: () => void;
    done: boolean;
  };
}