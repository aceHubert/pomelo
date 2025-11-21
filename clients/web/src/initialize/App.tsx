import { defineComponent, computed, onMounted, onUnmounted, ref } from '@vue/composition-api';
import { ConfigProvider } from '@/components/config-provider';
import { Spin, ANT_PREFIX_CLS } from '@/components/antdv-helper';
import { useI18n } from '@/composables';
import { useDeviceMixin } from '@/mixins/device';
import { useAppStore } from '@/store/app';
import { loadingRef } from '@/shared';

export default defineComponent({
  name: 'App',
  head() {
    return {
      title: this.siteTitle as string,
    };
  },
  setup() {
    const { siteTitle: title, supportLanguages, setLocale, primaryColor } = useAppStore();
    const i18n = useI18n();
    const deviceMixin = useDeviceMixin();

    const siteTitle = computed(() => {
      if (typeof title === 'function') {
        return title((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string);
      }
      return title;
    });

    const deviceType = computed(() => {
      return deviceMixin.device;
    });

    const locale = computed(() => {
      return i18n.locale;
    });

    // Particle Effect Logic
    const canvasRef = ref<HTMLCanvasElement | null>(null);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 130, g: 82, b: 171 }; // Default purple
    };

    onMounted(() => {
      const canvas = canvasRef.value;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const particles: Particle[] = [];
      const particleCount = 150; // Increased count for granular effect
      const connectionDistance = 120;
      const mouseDistance = 180;

      let mouseX = 0;
      let mouseY = 0;

      class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        alpha: number;

        constructor() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.vx = (Math.random() - 0.5) * 1.5;
          this.vy = (Math.random() - 0.5) * 1.5;
          this.size = Math.random() * 2 + 0.5; // Smaller size for granular effect
          this.alpha = Math.random() * 0.5 + 0.2;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;

          // Bounce off edges
          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;

          // Mouse interaction
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouseDistance) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouseDistance - distance) / mouseDistance;
            const directionX = forceDirectionX * force * 0.6;
            const directionY = forceDirectionY * force * 0.6;
            this.vx += directionX;
            this.vy += directionY;
          }
          // Limit speed
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          const maxSpeed = 2;
          if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
          }
        }

        draw() {
          if (!ctx) return;
          const { r, g, b } = hexToRgb(primaryColor || '#8252ab');
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
          ctx.fill();
        }
      }

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }

      const animate = () => {
        ctx.clearRect(0, 0, width, height);

        const { r, g, b } = hexToRgb(primaryColor || '#8252ab');

        particles.forEach((particle) => {
          particle.update();
          particle.draw();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.4 * (1 - distance / connectionDistance)})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        // Connect to mouse
        for (let i = 0; i < particles.length; i++) {
          const dx = particles[i].x - mouseX;
          const dy = particles[i].y - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouseDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.5 * (1 - distance / mouseDistance)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }

        requestAnimationFrame(animate);
      };

      animate();

      const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('mousemove', handleMouseMove);

      onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
      });
    });

    return {
      siteTitle,
      supportLanguages,
      deviceType,
      locale,
      setLocale,
      primaryColor,
      canvasRef,
    };
  },
  render() {
    return (
      <ConfigProvider
        prefixCls={ANT_PREFIX_CLS}
        primaryColor={this.primaryColor}
        device={this.deviceType}
        i18nRender={(...args: [string, string, Record<string, string>]) => this.$tv(...args) as string}
      >
        <div class="app-content__wrapper content-width-fixed" lang={this.locale}>
          <canvas ref="canvasRef" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />
          <Spin
            class="app-content__loading"
            spinning={loadingRef.value}
            tip={this.$tv('common.tips.loading_text', 'Loading...')}
          ></Spin>
          <ul class="locales">
            {this.supportLanguages.map((lang) => (
              <li
                class={['locale-item', { selected: lang.locale === this.$i18n.locale }]}
                onClick={() => this.setLocale(lang.locale)}
              >
                {lang.shortName}
              </li>
            ))}
          </ul>
          <router-view />
        </div>
      </ConfigProvider>
    );
  },
});
