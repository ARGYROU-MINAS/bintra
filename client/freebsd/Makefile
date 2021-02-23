.include <bsd.own.mk>

PREFIX?=	/usr/local
LIBDIR=		${PREFIX}/lib/pkg/
SHLIB_DIR?=	${LIBDIR}/
SHLIB_NAME?=	${PLUGIN_NAME}.so

PLUGIN_NAME=	bintra
SRCS=		bintra.c

PKGFLAGS!=	pkgconf --cflags pkg
CFLAGS+=	${PKGFLAGS} -I/usr/local/include
LDFLAGS+=	-L/usr/local/lib -lcurl

beforeinstall:
	${INSTALL} -d ${LIBDIR}

.include <bsd.lib.mk>
